import { createClient } from '@supabase/supabase-js';
import { Metadata, ResolvingMetadata } from 'next';
import CertificateClient from './CertificateClient';
import { notFound } from 'next/navigation';

// Initialize Supabase (Use your env variables)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Props = {
  params: { id: string }; // We will use certificate_code as the ID in the URL
};

// Pillar: SEO Optimized
export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { data: cert } = await supabase
    .from('certificates')
    .select('name, syllabus_name, certificate_image')
    .eq('certificate_code', params.id)
    .single();

  if (!cert) return { title: 'Certificate Not Found' };

  return {
    title: `${cert.name} - ${cert.syllabus_name} Certificate | GyanHub`,
    description: `Verify the official ${cert.syllabus_name} certificate issued to ${cert.name}.`,
    openGraph: {
      images: [cert.certificate_image || ''],
      title: `${cert.name} - Verified Credential`,
    },
  };
}

export default async function CertificateVerificationPage({ params }: Props) {
  const { data: certificate, error } = await supabase
    .from('certificates')
    .select(`
      *,
      syllabi ( id, name, modules )
    `)
    .eq('certificate_code', params.id)
    .single();

  if (error || !certificate) {
    notFound();
  }

  return <CertificateClient certificate={certificate} />;
}