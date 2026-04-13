import { Loader } from 'lucide-react';

import logoSvg from '/logo.svg';

type LoadingProps = {
  disclaimer: string;
};

export function LoadingPage({ disclaimer }: LoadingProps) {
  const title = 'Power Interview';

  return (
    <div className="flex justify-center items-center h-screen w-full bg-background ">
      <div className="flex flex-col items-center">
        <div className="flex gap-2 items-center">
          <img src={logoSvg} alt="Logo" width={32} height={32} className="mx-auto" />
          <p className="text-2xl font-bold">{title}</p>
        </div>
        <p className="animate-pulse text-sm mt-4">{disclaimer}</p>
        <Loader className="w-4 h-4 animate-spin" />
      </div>
    </div>
  );
}

export function Loading({ disclaimer }: LoadingProps) {
  return (
    <div className="flex flex-col items-center">
      <p className="animate-pulse text-sm mt-4">{disclaimer}</p>
      <Loader className="w-4 h-4 animate-spin" />
    </div>
  );
}
