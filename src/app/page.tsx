import { Metadata } from "next";
import Image from "next/image";


export const metadata: Metadata = {
  title: "AttendeeConnecter",
  description: "AttendeeConnecter 参加者同士のつながりを可視化する",
};

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8">
      <section className="mb-12 flex flex-col gap-12">
        <div className="py-3 flex flex-col gap-6">
          <h1 className="text-6xl font-extrabold text-center break-words">
            <span className="inline-block">"Attendee</span>
            <span className="inline-block">Connecter"</span>
          </h1>
          <div className="max-w-[600px] mx-auto border-gray-300 border rounded-sm overflow-hidden">
            <picture className="">
              <img src="/lp01.webp" alt="イベント参加者をつなぐシステム" className="w-full" />
            </picture>
          </div>
        </div>
        <h2 className="text-4xl font-bold mb-4">イベント参加者をつなぐシステム</h2>
        <p className="text-xl mb-8">AttendeeConnecterは、イベント参加者がスマホを使って他の参加者とつながり、それを可視化するシステムです。参加者同士のネットワーキングを促進し、イベントをより有意義なものにします。</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-2xl font-bold mb-4">リアルタイムな接続</h3>
            <p className="text-lg">参加者はスマホを使ってリアルタイムに他の参加者とつながることができます。共通の興味や目的を持つ人々とのネットワーキングが可能です。</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold mb-4">つながりの可視化</h3>
            <p className="text-lg">参加者間のつながりは直感的に理解しやすい形で可視化されます。これにより、イベント全体のネットワークを把握することができます。</p>
          </div>
        </div>
      </section>
    </main>
  );
}
