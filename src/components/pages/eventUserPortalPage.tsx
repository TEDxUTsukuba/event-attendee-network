"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/database";
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"



interface EventData {
    id: string;
    name: string;
}

interface ConnectionData {
    id: string;
    timestamp: Date;
    parent_id: string;
    child_id: string;
}

interface AttendeeData {
    id: string;
    name: string;
    questions: {
        [key: string]: string;
    }; // TODO これはみれないようにする
}

export default function EventUserPortalPage({ eventData }: { eventData: EventData }) {
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [connections, setConnections] = useState<ConnectionData[]>([]);
    const [attendees, setAttendees] = useState<AttendeeData[]>([]);
    const [showQRCode, setShowQRCode] = useState<boolean>(false);

    const sortedAttendees = useMemo(() => {
        return attendees.sort((a, b) => {
            const aConnections = connections.filter((connection) => connection.child_id === a.id);
            const bConnections = connections.filter((connection) => connection.child_id === b.id);

            // timestampの降順でソート
            aConnections.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            bConnections.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            return bConnections.length - aConnections.length;
        }).filter((attendee) => attendee.id !== userId);
    }, [attendees, connections]);


    useEffect(() => {
        async function fetchAttendees() {
            const eventRef = doc(db, 'events', eventData.id);
            const attendeesRef = collection(eventRef, 'attendees');
            const attendeesSnapshot = await getDocs(attendeesRef);

            const attendees = attendeesSnapshot.docs.map((doc) => {
                const docData = doc.data();

                return {
                    id: doc.id,
                    name: docData.name,
                    questions: docData.info,
                };
            });

            setAttendees(attendees);
        }


        async function fetchConnections(userId: string) {
            // localStorageからtokenを取得
            const eventRef = doc(db, 'events', eventData.id);
            const connectionsRef = collection(eventRef, 'connections');
            // parent_idが自身のuserIdのものを取得
            const connectionsQuery = query(connectionsRef, where('parent_id', '==', userId));
            const connectionsSnapshot = await getDocs(connectionsQuery);

            const connections = connectionsSnapshot.docs.map((doc) => {
                const docData = doc.data();

                return {
                    id: doc.id,
                    parent_id: docData.parent_id,
                    child_id: docData.child_id,
                    timestamp: docData.timestamp.toDate(),
                } as ConnectionData;
            });

            setConnections(connections);
        }


        // localStorageからtokenを取得
        const token = localStorage.getItem(`event-${eventData.id}-token`);
        const userId = localStorage.getItem(`event-${eventData.id}-userId`);

        if (!token || !userId) {
            router.push(`/event/${eventData.id}/register`);
            return;
        }

        fetchAttendees();
        fetchConnections(userId);

        setToken(token);
        setUserId(userId);
    }, [])

    const connecttedAttendees = useMemo(() => {
        return sortedAttendees.filter((attendee) => connections.find((connection) => connection.child_id === attendee.id)).sort((a, b) => {
            const aConnections = connections.find((connection) => connection.child_id === a.id);
            const bConnections = connections.find((connection) => connection.child_id === b.id);

            if (!aConnections || !bConnections) {
                return 0;
            }

            // timestampの降順でソート
            return bConnections.timestamp.getTime() - aConnections.timestamp.getTime();
        });
    }, [attendees, connections]);

    const notConnecttedAttendees = useMemo(() => {
        return sortedAttendees.filter((attendee) => !connections.find((connection) => connection.child_id === attendee.id));
    }, [attendees, connections]);

    const myUserData = useMemo(() => {
        return attendees.find((attendee) => attendee.id === userId);
    }, [attendees, userId]);

    const handleResetAccount = () => {
        localStorage.removeItem(`event-${eventData.id}-token`);
        localStorage.removeItem(`event-${eventData.id}-userId`);
        router.push(`/event/${eventData.id}/register`);
    }

    return (
        <div className="p-3 flex flex-col gap-6">
            <Card className={`max-w-md mx-auto duration-300 ease-in-out ${showQRCode ? "rotate-180" : "rotate-0"}`}>
                <CardHeader>
                    <h1 className="text-2xl font-bold text-center">{eventData.name}</h1>
                </CardHeader>
                <CardContent>
                    {userId &&
                        <div className="text-center w-full flex flex-col gap-1">
                            <div>
                                <h2 className="text-3xl font-bold text-primary">{myUserData?.name}</h2>
                            </div>
                            <p className="text-lg">{showQRCode ? "わたし / Me" : "あなた / You"}のID</p>
                            <QRCode fill="red" value={`${location.origin}/event/${eventData.id}/connect/${userId}`} className="mx-auto" />
                            <p className="text-xs font-thin">{userId}</p>
                        </div>
                    }
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-gray-500">自身のQRコードを他の参加者に見せて、参加者同士のつながりを作りましょう!</p>
                </CardFooter>
            </Card>
            <div className="flex justify-center gap-3">
                <Button variant="outline" onClick={() => setShowQRCode(!showQRCode)} size="icon">
                    <RefreshCcw size={24} />
                </Button>
                <Dialog>
                    <DialogTrigger>
                        <Button variant="outline">自分の回答を見る / View My Answers</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>自分の回答を見る / View My Answers</DialogTitle>
                            <DialogDescription className="py-3">
                                {myUserData && myUserData.questions && Object.entries(myUserData.questions).map(([question, answer]) => (
                                    <div key={question} className="flex flex-col gap-2 pb-3">
                                        <p className="text-sm font-bold">{question}</p>
                                        <p className="text-sm text-rose-400">{answer}</p>
                                    </div>
                                ))}
                            </DialogDescription>
                        </DialogHeader>
                    </DialogContent>
                </Dialog>
            </div>
            <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3">
                    <div>
                        <h2 className="text-lg text-center">つながった人たち / Connected People</h2>
                        <div className="text-center">
                            <p>
                                <b className="text-5xl text-rose-600">{connecttedAttendees.length}</b><span className="text-xl"> / {attendees.length}</span>
                            </p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-6">
                        {connecttedAttendees.map((attendee) => (
                            <div key={attendee.id} className="flex flex-col gap-1 items-center">
                                <Avatar className="w-16 h-16">
                                    <AvatarFallback className="bg-rose-100">{attendee.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <p className="text-xs text-center truncate font-bold">{attendee.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                <hr className="border-gray-300" />
                <div className="flex flex-col gap-3">
                    <h2 className="text-lg text-center">つながっていない人たち / Not Connected People</h2>
                    <div className="grid grid-cols-3 gap-x-3 gap-y-6">
                        {notConnecttedAttendees.map((attendee) => (
                            <div key={attendee.id} className="flex flex-col gap-1 items-center">
                                <Avatar className="w-16 h-16 border-gray-300 border">
                                    <AvatarFallback className="bg-white">{attendee.name.slice(0, 2)}</AvatarFallback>
                                </Avatar>
                                <p className="text-xs text-center truncate text-gray-400">{attendee.name}</p>
                            </div>
                        ))}
                    </div>
                </div>
                {!myUserData && (
                    <Button variant="link" onClick={handleResetAccount}>
                        アカウントをリセット / Reset Account
                    </Button>
                )}
            </div>
        </div>
    );
}
