"use client";

import { pickupNQuestions } from "@/lib/question";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Card, CardHeader, CardContent, CardFooter } from "../ui/card";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Avatar, AvatarFallback } from "../ui/avatar";

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

type QuestionItem = {
  index: number;
  question: string;
};

export default function EventUserRegisterPage({ eventData }: { eventData: EventData }) {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [myColor, setMyColor] = useState<string>("#F4F4F5");

  useEffect(() => {
    setQuestions(pickupNQuestions(3).map(item => ({ index: item.index, question: item.question })));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(`event-${eventData.id}-token`);
    if (token) {
      router.push(`/event/${eventData.id}/portal`);
    }
    setMyColor(getRandomColor());
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

  const changeQuestion = (index: number) => {
    const newQuestions = [...questions];
    const newQuestions_indexes = newQuestions.map((question) => question.index);

    const newQuestion = pickupNQuestions(1, newQuestions_indexes).map(item => ({ index: item.index, question: item.question }));

    if (newQuestions_indexes.includes(newQuestion[0].index)) {
      changeQuestion(index);
    }

    newQuestions.splice(index, 1, newQuestion[0]);

    setQuestions(newQuestions);
  };

  const onSubmit = async () => {
    const isNicknameValid: boolean = !(userData.name === undefined || (userData.name as string).trim() === "");
    var isNotEmptyFlag: boolean = false;

    if (!isNicknameValid) {
      setErrors((prevErrors) => ({ ...prevErrors, e_nickname: "ニックネームを入力してください" }));
      isNotEmptyFlag = true;
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, e_nickname: "" }));
    }

    questions.forEach((question) => {
      if (userData.questions[question.question] === undefined || userData.questions[question.question].trim() === "") {
        setErrors((prevErrors) => ({ ...prevErrors, [question.question]: "回答を入力してください" }));
        isNotEmptyFlag = true;
      } else {
        setErrors((prevErrors) => ({ ...prevErrors, [question.question]: "" }));
      }
    });

    if (loading || isNotEmptyFlag) {
      return;
    }
    setLoading(true);

    const response = await fetch(`/api/event/register`, {
      method: "POST",
      body: JSON.stringify({
        eventId: eventData.id,
        userData,
        myColor,
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

  function getRandomColor() {
    const letters = '37D';

    let color = '#'
    for (let i = 0; i < 3; i++) {
      const tmp = letters[Math.floor(Math.random() * 3)]
      color += tmp + tmp;
    }

    return color;
  }


  function getTextColor(color: string) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 125 ? true : false;
  }

  const handleColorChange = () => {
    setMyColor(getRandomColor());
  }


  return (
    <div className="px-3 h-screen flex items-center justify-center">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <h1 className="text-2xl font-bold">{eventData.name}</h1>
        </CardHeader>
        <CardContent className="grid gap-4">
          <h2 className="text-lg font-bold">あなたの情報を入力してください</h2>
          <div className="flex flex-col gap-3 items-center">
            <Avatar className={` text-white w-20 h-20 hover:scale-105 active:scale-90 active:rotate-[359deg] duration-200 ease-in-out transition-all`} onClick={handleColorChange}>
              <AvatarFallback className="text-2xl transition-all duration-500" style={{ backgroundColor: myColor, color: getTextColor(myColor) ? "#000000" : "#FFFFFF" }}>{userData.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            <p className="text-xs text-gray-500">アイコンをタップして色を変更</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="nickname">ニックネーム</Label>
            <Input id="nickname" placeholder="ニックネームを入力してください" onChange={onChangeNickname} />
            {errors.e_nickname && <p className="text-red-500">{errors.e_nickname}</p>}
          </div>
          <h2 className="text-lg font-bold">あなたに関する3つの質問</h2>
          {questions.map((question, index) => (
            <div key={question.index} className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={String(question.index)}>{question.question}</Label>
                <Button size="sm" onClick={() => changeQuestion(index)}>
                  変更
                </Button>
              </div>
              <Input id={String(question.index)} placeholder="回答を入力してください" onChange={(e) => onChangeQuestion(question.question, e)} />
              {errors[question.question] && <p className="text-red-500">{errors[question.question]}</p>}
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
