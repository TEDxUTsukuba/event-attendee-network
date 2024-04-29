
import { db } from "@/firebase/database";
import { doc, getDoc } from "firebase/firestore";
import EventUserConnectPage from "@/components/pages/eventUserConnectPage";

interface EventData {
    id: string;
    name: string;
}



async function getEventData(eventId: string) {
    const eventRef = doc(db, 'events', eventId);
    const eventDoc = await getDoc(eventRef);
    return {
        id: eventDoc.id,
        ...eventDoc.data(),
    } as EventData;
}


export default async function UserConnectPage({
    params,
}: {
    params: { eventId: string, userId: string };
}) {
    const { eventId, userId } = params;
    const eventData = await getEventData(eventId);

    return (
        <EventUserConnectPage eventData={eventData} targetUserId={userId} />
    );
}
