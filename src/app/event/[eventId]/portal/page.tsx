
import { db } from "@/firebase/database";
import { doc, getDoc } from "firebase/firestore";
import EventUserPortalPage from "@/components/pages/eventUserPortalPage";

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

export default async function RegisterEvent({
    params,
}: {
    params: { eventId: string };
}) {
    const { eventId } = params;
    const eventData = await getEventData(eventId);

    return (
        <EventUserPortalPage eventData={eventData} />
    );
}
