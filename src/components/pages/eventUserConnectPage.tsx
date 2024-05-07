"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { toast } from "sonner"
import { Avatar, AvatarFallback } from "../ui/avatar";
import { getTextColor } from "@/lib/utils";
import { useReward } from 'react-rewards';

interface EventData {
    id: string;
    name: string;
}

interface TargetUserData {
    name: string;
    question: string;
    color: string;
}

export default function EventUserConnectPage({ eventData, targetUserId }: { eventData: EventData, targetUserId: string }) {
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [targetUserData, setTargetUserData] = useState<TargetUserData>({
        name: "",
        question: "",
        color: "#FFE4E5",
    });
    const [answer, setAnswer] = useState<string>("");
    const [error, setError] = useState('');
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alreadyConnected, setAlreadyConnected] = useState(false);

    const { reward, isAnimating } = useReward('correctAni', 'confetti', {
        elementCount: 100,
        elementSize: 20,
        spread: 150,
        decay: 0.9,
        lifetime: 200,
    });
    const { reward: wrongReward, isAnimating: isWrongAnimating } = useReward('wrongAni', 'emoji', {
        emoji: ['❌', '😢', '😭', '😡', '💔'],
        elementCount: 20,
        elementSize: 20,
        spread: 70,
        decay: 0.9,
        lifetime: 200,
    });

    useEffect(() => {
        async function fetchTargetUserData(token: string) {
            const response = await fetch(`/api/event/connect?userId=${targetUserId}`, {
                method: "GET",
                headers: {
                    Authorization: `${token}`
                }
            });

            if (!response.ok) {
                if (response.status == 409) {
                    setConnected(true);
                    setAlreadyConnected(true);
                    const data = await response.json();
                    setTargetUserData(data);
                } else if (response.status == 404) {
                    router.push(`/event/${eventData.id}/portal`);
                } else {
                    router.push(`/event/${eventData.id}/portal`);
                }
            } else {
                const data = await response.json();
                setTargetUserData(data);
            }
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
        if (answer.trim() === '') {
            setError('回答を入力してください！');
            return;
        }

        setLoading(true);
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
            if (response.status == 406) {
                toast.error("回答が間違っています！");
                wrongReward();
            } else {
                toast.error("エラーが発生しました。");
            }
        } else {
            setConnected(true);
            reward();
            toast.success("つながりました！");
        }
        setLoading(false);
    }

    return (
        <div className="px-3 h-screen flex items-center justify-center">
            <Card className="max-w-md mx-auto w-full">
                <CardHeader>
                    <h1 className="text-2xl font-bold">{eventData.name}</h1>
                    <h2 className="text-lg font-bold"><span className="text-rose-600">{targetUserData.name}</span> とつながる</h2>
                    <div className="flex flex-col gap-3 items-center">
                        <Avatar className={` text-white w-20 h-20`}>
                            <AvatarFallback className="text-2xl transition-all duration-500" style={{ backgroundColor: targetUserData.color, color: getTextColor(targetUserData.color) ? "#000000" : "#FFFFFF" }}>{targetUserData.name.slice(0, 2)}</AvatarFallback>
                        </Avatar>
                    </div>
                    <div className="text-center">
                        <span id="correctAni"></span>
                        <span id="wrongAni"></span>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    {connected ? <>
                        <p className="text-2xl text-rose-600 text-center font-bold">{alreadyConnected ? "すでにつながっています！" : "つながりました！"}</p>
                        <Button size="lg" disabled={isAnimating} className="w-full" onClick={() => router.push(`/event/${eventData.id}/portal`)}>ポータルに戻る</Button>
                    </> : <>
                        <p className="text-sm text-gray-500">相手に関する質問に正解するとつながることができます。相手から答えを聞いてみましょう！</p>
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="answer" className="block">{targetUserData.question}</Label>
                            <Input id="answer" type="text" placeholder="答え" className="border border-gray-300 rounded-md w-full" onChange={(e) => setAnswer(e.target.value)} />
                            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                        </div>
                        <Button size="lg" className="w-full" onClick={onSubmit} disabled={!answer || loading}>つながる</Button>
                    </>}
                </CardContent>
            </Card>
        </div>
    );
}
