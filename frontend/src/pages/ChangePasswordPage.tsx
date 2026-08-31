import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import PageTransition from '../components/ui/PageTransition';
import { changePassword } from '../services/authService';
const schema = z.object({ currentPassword: z.string().min(1,'Required'), newPassword: z.string().min(8,'Min 8'), confirmPassword: z.string().min(1,'Required') }).refine(d=>d.newPassword===d.confirmPassword,{message:'No match',path:['confirmPassword']});
type Form = z.infer<typeof schema>;
export default function ChangePasswordPage(){
  const navigate=useNavigate();
  const [error,setError]=useState<string|null>(null);
  const [success,setSuccess]=useState<string|null>(null);
  const [isSubmitting,setIsSubmitting]=useState(false);
  const [show,setShow]=useState(false);
  const [show2,setShow2]=useState(false);
  const {register,handleSubmit,formState:{errors}}=useForm<Form>({resolver:zodResolver(schema)});
  const onSubmit=async(d:Form)=>{
    setError(null);setSuccess(null);setIsSubmitting(true);
    try{ await changePassword(d.currentPassword,d.newPassword,d.confirmPassword); setSuccess('Password changed!'); setTimeout(()=>navigate('/login',{replace:true}),2000); }catch(err:any){
      const s=err?.response?.status; const m=err?.response?.data?.detail;
      if(s===401) setError('Current password incorrect'); else if(s===400) setError(m||'Invalid'); else setError('Unable to change password');
    } finally{ setIsSubmitting(false); }
  };
  return (<PageTransition className="texture-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-navy-950)] px-4 py-10">
  <div className="relative w-full max-w-md"><div className="relative overflow-hidden rounded-[12px] border bg-[var(--color-navy-900)]/85 backdrop-blur-xl p-6">
    <h2 className="text-center text-xl font-semibold text-white">Change Password</h2>
    <p className="mb-6 text-center text-sm text-slate-400">Enter current and new password</p>
    {error&&<div className="mb-4 flex gap-2 rounded-lg border border-red-400/30 bg-red-500/15 px-3 py-2 text-sm text-red-300"><AlertCircle className="h-4 w-4"/>{error}</div>}
    {success&&<div className="mb-4 flex gap-2 rounded-lg border border-emerald-400/30 bg-emerald-500/15 px-3 py-2 text-sm text-emerald-300"><CheckCircle className="h-4 w-4"/>{success}</div>}
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div><label className="text-sm text-slate-300">Current Password</label><div className="relative"><input type={show?'text':'password'} {...register('currentPassword')} className="w-full rounded-lg border bg-white px-4 py-3 pr-10 text-sm text-black"/><button type="button" onClick={()=>setShow(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2">{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>{errors.currentPassword&&<p className="text-xs text-red-400">{errors.currentPassword.message}</p>}</div>
      <div><label className="text-sm text-slate-300">New Password</label><div className="relative"><input type={show?'text':'password'} {...register('newPassword')} className="w-full rounded-lg border bg-white px-4 py-3 pr-10 text-sm text-black"/><button type="button" onClick={()=>setShow(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2">{show?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>{errors.newPassword&&<p className="text-xs text-red-400">{errors.newPassword.message}</p>}</div>
      <div><label className="text-sm text-slate-300">Confirm</label><div className="relative"><input type={show2?'text':'password'} {...register('confirmPassword')} className="w-full rounded-lg border bg-white px-4 py-3 pr-10 text-sm text-black"/><button type="button" onClick={()=>setShow2(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2">{show2?<EyeOff className="h-5 w-5"/>:<Eye className="h-5 w-5"/>}</button></div>{errors.confirmPassword&&<p className="text-xs text-red-400">{errors.confirmPassword.message}</p>}</div>
      <button type="submit" disabled={isSubmitting} className="w-full rounded-lg bg-[var(--color-accent-primary)] py-3 text-sm font-semibold text-white disabled:opacity-50">{isSubmitting?<Loader2 className="animate-spin h-4 w-4 mr-2 inline"/>:null}Change Password</button>
    </form>
  </div></div></PageTransition>);
}
