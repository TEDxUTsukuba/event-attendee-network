"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"

interface EventData {
    id: string;
    name: string;
}

interface TargetUserData {
    name: string;
    question: string;
}

export default function EventUserConnectPage({ eventData, targetUserId }: { eventData: EventData, targetUserId: string }) {
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [targetUserData, setTargetUserData] = useState<TargetUserData>({
        name: "",
        question: "",
    });
    const [answer, setAnswer] = useState<string>("");

    useEffect(() => {
        async function fetchTargetUserData(token: string) {
            const response = await fetch(`/api/event/connect?userId=${targetUserId}`, {
                method: "GET",
                headers: {
                    Authorization: `${token}`
                }
            });
            const data = await response.json();
            console.log(data);
            setTargetUserData(data);
        }

        const token = localStorage.getItem(`event-${eventData.id}-token`);

        if (!token) {
            router.push(`/event/${eventData.id}/register`);
            return;
        }

        fetchTargetUserData(token);
        setToken(token);
    }, []);

    const onSubmit = async () => {
        const response = await fetch(`/api/event/connect`, {
            method: "POST",
            headers: {
                Authorization: `${token}`
            },
            body: JSON.stringify({
                targetUserId,
                question: targetUserData.question,
                answer,
            }),
        });

        if (!response.ok) {
            console.error("Error");
        }

        router.push(`/event/${eventData.id}/portal`);
    }

    return (
        <div className="max-w-md mx-auto flex flex-col gap-3">
            <h1 className="text-lg font-bold">{eventData.name}</h1>
            <h2 className="text-lg font-bold">{targetUserData.name}</h2>
            <div>
                <label className="block">Question: {targetUserData.question}</label>
                <input type="text" className="border border-gray-300 rounded-md w-full" onChange={(e) => setAnswer(e.target.value)} />
            </div>
            <button className="bg-blue-500 text-white rounded-md py-2" onClick={onSubmit}>Connect</button>
        </div>
    );
}
