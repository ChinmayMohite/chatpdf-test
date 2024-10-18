import { auth, currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
// import { razorpay } from '@/lib/razorpay';
import { userSubscriptions } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq } from 'drizzle-orm';