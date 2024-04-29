"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "react-qr-code";
import { useRouter } from "next/navigation";
import { db } from "@/firebase/database";
import { collection, doc, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";


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
}

export default function EventUserPortalPage({ eventData }: { eventData: EventData }) {
    const router = useRouter();
    const [token, setToken] = useState<string>("");
    const [userId, setUserId] = useState<string>("");
    const [connections, setConnections] = useState<ConnectionData[]>([]);
    const [attendees, setAttendees] = useState<AttendeeData[]>([]);

    const sortedAttendees = useMemo(() => {
        return attendees.sort((a, b) => {
            const aConnections = connections.filter((connection) => connection.child_id === a.id);
            const bConnections = connections.filter((connection) => connection.child_id === b.id);

            // timestampの降順でソート
            aConnections.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            bConnections.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            return bConnections.length - aConnections.length;
        });
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

    return (
        <div className="p-3 flex flex-col gap-6">
            <Card className="max-w-md mx-auto">
                <CardHeader>
                    <h1 className="text-2xl font-bold text-center">{eventData.name}</h1>
                </CardHeader>
                <CardContent>
                    {userId &&
                        <div className="text-center w-full flex flex-col gap-1">
                            <h2 className="text-lg">あなたのID</h2>
                            <QRCode value={`${location.origin}/event/${eventData.id}/connect/${userId}`} className="mx-auto" />
                            <p className="text-xs font-thin">{userId}</p>
                        </div>
                    }
                </CardContent>
                <CardFooter>
                    <p className="text-sm text-gray-500">自身のQRコードを他の参加者に見せて、参加者同士のつながりを作りましょう!</p>
                </CardFooter>
            </Card>
            <h2 className="text-lg">つながった人たち</h2>
            <div className="flex flex-col gap-2">
                {sortedAttendees.map((attendee) => (
                    <div key={attendee.id} className="flex flex-col gap-1">
                        <h3 className={`text-lg ${connections.find((connection) => connection.child_id === attendee.id) ? 'text-blue-500 font-bold' : 'text-gray-300'}`}>{attendee.name}</h3>
                    </div>
                ))}
            </div>
        </div>
    );
}
