"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

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
        <div className="px-3 h-screen flex items-center justify-center">
            <Card className="max-w-md mx-auto w-full">
                <CardHeader>
                    <h1 className="text-2xl font-bold">{eventData.name}</h1>
                    <h2 className="text-lg font-bold">{targetUserData.name} とつながる</h2>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-sm text-gray-500">相手に関する質問に正解するとつながることができます。相手から答えを聞いてみましょう！</p>
                    <div>
                        <Label htmlFor="answer" className="block">{targetUserData.question}</Label>
                        <Input id="answer" type="text" className="border border-gray-300 rounded-md w-full" onChange={(e) => setAnswer(e.target.value)} />
                    </div>
                    <Button size="lg" className="w-full" onClick={onSubmit}>つながる</Button>
                </CardContent>
            </Card>
        </div>
    );
}
