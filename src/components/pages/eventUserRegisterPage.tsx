"use client";

import { pickupNQuestions } from "@/lib/question";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

interface EventData {
  id: string;
  name: string;
}

interface UserData {
  name: string;
  questions: {
    [key: string]: string;
  };
}

export default function EventUserRegisterPage({ eventData }: { eventData: EventData }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    setQuestions(pickupNQuestions(3));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(`event-${eventData.id}-token`);
    if (token) {
      router.push(`/event/${eventData.id}/portal`);
    }
  }, []);

  const [userData, setUserData] = useState<UserData>({
    name: "",
    questions: {},
  });

  const onChangeNickname = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      name: e.target.value,
    });
  }

  const onChangeQuestion = (question: string, e: React.ChangeEvent<HTMLInputElement>) => {
    setUserData({
      ...userData,
      questions: {
        ...userData.questions,
        [question]: e.target.value,
      },
    });
  }

  const onSubmit = async () => {
    if (loading) {
      return;
    }
    setLoading(true);

    const response = await fetch(`/api/event/register`, {
      method: "POST",
      body: JSON.stringify({
        eventId: eventData.id,
        userData,
      }),
    });

    if (!response.ok) {
      console.error("Error");
      return;
    }

    const data = await response.json();
    console.log(data);

    const token = data.token;
    const userId = data.userId;

    localStorage.setItem(`event-${eventData.id}-token`, token);
    localStorage.setItem(`event-${eventData.id}-userId`, userId); // 保存しなくてもいいけど、一応

    // リダイレクト
    router.push(`/event/${eventData.id}/portal`);

    setLoading(false);
  }


  return (
    <div className="px-3 h-screen flex items-center justify-center">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">{eventData.name}</h1>
        </CardHeader>
        <CardContent className="grid gap-4">
          <h2 className="text-lg font-bold">あなたの情報を入力してください</h2>
          <div className="grid gap-2">
            <Label htmlFor="nickname">ニックネーム</Label>
            <Input id="nickname" placeholder="ニックネームを入力してください" onChange={onChangeNickname} />
          </div>
          <h2 className="text-lg font-bold">あなたに関する3つの質問</h2>
          {questions.map((question) => (
            <div key={question} className="grid gap-2">
              <Label htmlFor={question}>{question}</Label>
              <Input id={question} placeholder="回答を入力してください" onChange={(e) => onChangeQuestion(question, e)} />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Button size="lg" className="w-full" onClick={onSubmit} disabled={loading}>
            登録
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
