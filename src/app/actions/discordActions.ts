
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function linkDiscordAccount(code: string) {
  const cookieStore = cookies();
  const userId = cookieStore.get('discord_user_id')?.value;
  
  // Use environment variable for the base URL, essential for Vercel deployment
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (!baseUrl) {
      console.error('NEXT_PUBLIC_BASE_URL is not set in environment variables.');
      // Redirect to an error page, providing a clear reason for the user
      return redirect('/profile?discord=error&reason=config_error_base_url');
  }

  if (!userId) {
    console.error('Discord callback: User ID not found in cookies.');
    return redirect('/profile?discord=error&reason=no_user');
  }

  const CLIENT_ID = process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID;
  const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
  const REDIRECT_URI = `${baseUrl}/discord/callback`;

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Discord credentials not set in environment variables.');
    return redirect('/profile?discord=error&reason=config_error');
  }

  try {
    // 1. Exchange the code for an access token
    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok) {
      console.error('Discord token exchange failed:', tokenData);
      throw new Error(tokenData.error_description || 'Failed to get access token.');
    }

    // 2. Use the access token to get user data
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const userData = await userResponse.json();
    if (!userResponse.ok) {
      console.error('Discord get user failed:', userData);
      throw new Error('Failed to get user data from Discord.');
    }

    // 3. Update the user document in Firestore
    const { id: discordId, username, discriminator, avatar } = userData;
    const fullUsername = discriminator === '0' || !discriminator ? username : `${username}#${discriminator}`;
    const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : null;

    const userRef = doc(db, 'users', userId);
    const dataToUpdate: { discordId: string; discordUsername: string; avatar?: string } = {
      discordId: discordId,
      discordUsername: fullUsername,
    };

    if (avatarUrl) {
      // Only update avatar if a new one is available from Discord
      dataToUpdate.avatar = avatarUrl;
    }

    await updateDoc(userRef, dataToUpdate);

  } catch (error) {
    console.error('Discord callback handler error:', error);
    const reason = (error instanceof Error) ? encodeURIComponent(error.message) : 'callback_failed';
    return redirect(`/profile?discord=error&reason=${reason}`);
  } finally {
     cookieStore.delete('discord_user_id');
  }

  // 4. Redirect back to the profile page on success
  redirect('/profile?discord=linked');
}
