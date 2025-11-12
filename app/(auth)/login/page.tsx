'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LoaderIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { login } from '@/actions/auth';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (token) {
      router.push("/");
    }
  }, [router]);

  const onSignIn = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    
    try {
      const result = await login({
        username: email,
        password: password,
      });

      if (result.success) {
        // Store token if available
        if (result.token) {
          localStorage.setItem('authToken', result.token);
        }
        
        // Store user info
        if (result.user) {
          localStorage.setItem('user', JSON.stringify(result.user));
        }
        
        toast.success("Login Successfully");
        router.push('/');
      } else {
        toast.error(result.error || 'Login failed. Please check your credentials.');
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred during login. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className='flex items-baseline justify-center my-10'>
      <div className='flex flex-col items-center justify-center p-10 bg-slate-100 border border-gray-200'>
        <Image src='/logo.png' width={200} height={200} alt='logo' />
        <h2 className='font-bold text-3xl'>Sign In</h2>
        <h2 className='text-gray-500'>Enter your Email and Password to Sign In</h2>

        {/* Inputs */}
        <div className='w-full flex flex-col gap-5 mt-7'>
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
            onClick={onSignIn}
            disabled={!(email && password) || loading}
            className="w-full bg-[#31B65D] hover:bg-[#31B65D]/90 text-white"
          >
            {loading ? <LoaderIcon className='animate-spin' /> : "Sign In"}
          </Button>
          <p>
            Don't have an account{' '}
            <Link href={'/register'} className='text-blue-500 hover:underline'>
              Click here to create new account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}