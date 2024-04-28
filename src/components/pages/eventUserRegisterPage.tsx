"use client";

import { pickupNQuestions } from "@/lib/question";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"

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
  const [questions, setQuestions] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    setQuestions(pickupNQuestions(3));
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
    console.log(userData);
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
  }


  return (
    <div className="max-w-md mx-auto flex flex-col gap-3">
      <h1 className="text-lg font-bold">{eventData.name}</h1>
      <p>{JSON.stringify(userData)}</p>
      <h2 className="text-lg">あなたの情報を入力してください</h2>
      <div>
        <label>ニックネーム</label>
        <input type="text" className="block w-full mt-1" placeholder="ニックネームを入力してください" onChange={onChangeNickname} />
      </div>
      <h2 className="text-lg">あなたに関する3つの質問</h2>
      {questions.map((question) => (
        <div key={question}>
          <label>{question}</label>
          <input type="text" className="block w-full mt-1" placeholder="回答を入力してください" onChange={(e) => onChangeQuestion(question, e)} />
        </div>
      ))}
      <button className="block w-full mt-4 bg-blue-500 text-white font-bold py-2 px-4 rounded" onClick={onSubmit}>登録</button>
    </div>
  );
}
