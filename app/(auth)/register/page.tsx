'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { register } from '@/actions/auth';
import { toast } from 'sonner';
import { LoaderIcon } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onCreateAccount = async () => {
    if (!username || !email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    
    try {
      const result = await register({
        username,
        email,
        password,
      });

      if (result.success && result.customer) {
        toast.success("Account Created Successfully");
        // Redirect to login page after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 1000);
      } else {
        toast.error(result.error || 'Registration failed. Please try again.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during registration. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex items-baseline justify-center my-10'>
      <div className='flex flex-col items-center justify-center p-10 bg-slate-100 border border-gray-200'>
        <Image src='/logo.png' width={200} height={200} alt='logo' />
        <h2 className='font-bold text-3xl'>Create an Account</h2>
        <h2 className='text-gray-500'>Enter your Email and Password to Create an account</h2>

        {/* Inputs */}
        <div className='w-full flex flex-col gap-5 mt-7'>
          <Input 
            placeholder='Username' 
            value={username}
            onChange={(e) => setUsername(e.target.value)} 
          />
          <Input 
            type="email"
            placeholder='name@example.com' 
            value={email}
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            type='password' 
            placeholder='password' 
            value={password}
            onChange={(e) => setPassword(e.target.value)} 
          />
          <Button 
            onClick={onCreateAccount}
            disabled={(!username || !email || !password) || loading}
            className="w-full bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
          >
            {loading ? <LoaderIcon className='animate-spin' /> : "Create an Account"}
          </Button>
          <p>
            Already have an account{' '}
            <Link href={'/login'} className='text-blue-500 hover:underline'>
              Click here to Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}