export const metadata = {
  title: 'Angie AI Assistant',
  description: 'Your WordPress AI Assistant powered by Next.js',
};

export default function AngieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
