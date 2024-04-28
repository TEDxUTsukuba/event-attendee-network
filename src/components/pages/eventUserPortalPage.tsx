"use client";


interface EventData {
    id: string;
    name: string;
}


export default function EventUserPortalPage({ eventData }: { eventData: EventData }) {

    return (
        <div className="max-w-md mx-auto flex flex-col gap-3">
            <h1 className="text-lg font-bold">{eventData.name}</h1>
            <h2 className="text-lg">あなたのID</h2>
            <p className="text-2xl font-black">AAA</p>
            <h2>コネクトする</h2>
            <div>
                <label>コネクトするID</label>
                <input type="text" className="block w-full mt-1" placeholder="コネクトするIDを入力してください" />
            </div>
            <div>
                <p>コネクトするには、このあと聞かれる相手に関する質問に正解する必要があります。</p>
                <button className="bg-blue-500 text-white rounded-md p-2 mt-2">コネクトを開始</button>
            </div>
        </div>
    );
}
