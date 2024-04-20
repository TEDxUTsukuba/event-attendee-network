"use client";

import { db } from "@/firebase/database";
import { doc, collection, query, onSnapshot } from "firebase/firestore";
import { useEffect, useState, useMemo } from "react";
import VisGraph, {
  GraphData,
  GraphEvents,
  Options,
} from 'react-vis-graph-wrapper';


export default function VisualizeNetwork({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const [attendees, setAttendees] = useState([] as any[]);
  const [connections, setConnections] = useState([] as any[]);

  useEffect(() => {
    if (!eventId) return;

    const eventRef = doc(db, 'events', eventId as string);

    // attendeesのリアルタイム取得
    const attendeesQuery = query(collection(eventRef, 'attendees'));
    const unsubscribeAttendees = onSnapshot(attendeesQuery, (snapshot) => {
      const attendeesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(attendeesData);
      setAttendees(attendeesData);
    });

    // connectionsのリアルタイム取得
    const connectionsQuery = query(collection(eventRef, 'connections'));
    const unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
      const connectionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(connectionsData);
      setConnections(connectionsData);
    });

    // クリーンアップ関数
    return () => {
      unsubscribeAttendees();
      unsubscribeConnections();
    };
  }, [eventId]);

  const graphData = useMemo(() => {
    const nodes = attendees.map((attendee) => ({
      id: attendee.id,
      label: attendee.name,
      // title: attendee.role,
    }));

    const edges = connections.map((connection) => ({
      from: connection.parent_id,
      to: connection.child_id,
    }));

    return {
      nodes,
      edges,
    };
  }, [attendees, connections]);

  const options = {
    layout: {
      hierarchical: false,
    },
    edges: {
      color: '#000000',
    },
    height: '100%',
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -26,
        centralGravity: 0.005,
        springLength: 230,
        springConstant: 0.18,
        avoidOverlap: 1.5,
      },
      maxVelocity: 146,
      minVelocity: 0.75,
      timestep: 0.5,
    },
    interaction: {
      zoomView: false,
    },
  };

  return (
    <div>
      <h1>Event: {eventId}</h1>
      <h2>Attendees</h2>
      <ul>
        {attendees.map((attendee) => (
          <li key={attendee.id}>
            {attendee.name} - {attendee.role}
          </li>
        ))}
      </ul>
      <h2>Connections</h2>
      <ul>
        {connections.map((connection) => (
          <li key={connection.id}>
            {connection.parent_id} → {connection.child_id}
          </li>
        ))}
      </ul>
      {graphData.nodes.length > 0 && (
        <div className="h-screen w-screen fixed left-0 top-0">
          <VisGraph graph={graphData} options={options} style={{ height: '100%', width: '100%' }} />
        </div>
      )}
    </div>
  );
}
