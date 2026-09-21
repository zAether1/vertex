import { Suspense } from 'react';
import LoginClient from './LoginClient';
export const metadata = { title: 'Iniciar sesión — Vertex', robots: { index: false, follow: false } };
export default function LoginPage() { 
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <LoginClient />
    </Suspense>
  ); 
}
