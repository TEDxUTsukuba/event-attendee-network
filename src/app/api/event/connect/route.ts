import firebaseAdminApp from "@/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import jwt from "jsonwebtoken";


export async function GET(request: Request) {
    // headers から token を取得
    const token = request.headers.get("Authorization");

    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        // token の検証
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            eventId: string;
            dateStr: string;
        };

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get("userId");

        if (!userId) {
            return new Response("Bad Request", { status: 400 });
        }

        const eventId = decoded.eventId;

        const db = getFirestore(firebaseAdminApp);
        const targetUser = await db.collection('events').doc(eventId).collection('attendees').doc(userId).get();

        if (!targetUser.exists) {
            return new Response("Not Found", { status: 404 });
        }

        const questions = targetUser.data()?.info;

        // questionsの中からキーのみをランダムに取得
        const keys = Object.keys(questions);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];

        return new Response(JSON.stringify({
            name: targetUser.data()?.name,
            question: randomKey,
        }), {});
    } catch (e) {
        return new Response("Unauthorized", { status: 401 });
    }
}

export async function POST(request: Request) {
    const { targetUserId, question, answer }: { targetUserId: string; question: string; answer: string } = await request.json();

    const token = request.headers.get("Authorization");

    if (!token) {
        return new Response("Unauthorized", { status: 401 });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
            userId: string;
            eventId: string;
            dateStr: string;
        };

        const eventId = decoded.eventId;

        const db = getFirestore(firebaseAdminApp);

        const targetUser = await db.collection('events').doc(eventId).collection('attendees').doc(targetUserId).get();

        if (!targetUser.exists) {
            return new Response("Not Found", { status: 404 });
        }

        const questions = targetUser.data()?.info;

        if (!questions) {
            return new Response("Bad Request", { status: 400 });
        }

        if (!questions[question]) {
            return new Response("Bad Request", { status: 400 });
        }

        if (questions[question] !== answer) {
            return new Response("Not Acceptable", { status: 406 });
        }

        const connection = await db.collection('events').doc(eventId).collection('connections').add({
            parent_id: decoded.userId,
            child_id: targetUserId,
            questions: [question],
            timestamp: new Date(),
        });

        return new Response(JSON.stringify({ connectionId: connection.id }), {});

    } catch (e) {
        return new Response("Unauthorized", { status: 401 });
    }
}