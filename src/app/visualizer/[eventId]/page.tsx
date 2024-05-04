"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/firebase/database";
import { doc, collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { useEffect, useState, useMemo, useRef } from "react";
import VisGraph, {
  GraphData,
  GraphEvents,
  Options,
  Node,
  Network,
} from 'react-vis-graph-wrapper';


export default function VisualizeNetwork({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const [attendees, setAttendees] = useState([] as any[]);
  const [connections, setConnections] = useState([] as any[]);
  const networkRef = useRef<Network | null>(null);

  function getRandomColor() {
    const letters = '89ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 8)];
    }
    return color;
  }

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
    const nodes: Node[] = attendees.map((attendee) => ({
      id: attendee.id,
      label: attendee.name,
      // title: attendee.role,
      // valueはconnectionの数によって変える
      value: connections.filter((connection) => connection.parent_id === attendee.id).length,
      color: getRandomColor(),

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

  const options: Options = {
    autoResize: true,
    layout: {
      hierarchical: false,
    },
    edges: {
      color: {
        color: '#000000',
        highlight: '#fc5720',
        opacity: 0.7,
      },
      smooth: {
        enabled: true,
        type: 'dynamic',
        forceDirection: 'none',
        roundness: 0.5,
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 1.25,
        },
      },
      width: 2.5,
    },
    nodes: {
      shape: "dot",
      scaling: {
        label: {
          min: 8,
          max: 20,
        },
      },
      font: {
        background: 'rgba(255,255,255,0.8)',
      },
      color: {
        border: '#000000',
        background: '#666666',
        highlight: {
          border: '#fc5720',
          background: '#ffcc00',
        },
      },
      labelHighlightBold: true,
    },
    height: '100%',
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
        centralGravity: 0.005,
        springLength: 200,
        springConstant: 0.5,
        avoidOverlap: 3.5,
      },
      maxVelocity: 50,
      minVelocity: 0.75,
      timestep: 0.1,
      stabilization: {
        enabled: true,
        iterations: 100000,
        updateInterval: 5000,
        onlyDynamicEdges: true,
        fit: true,
      },
    },
    interaction: {
      zoomView: false,
    },
  };

  const moveToOptions: any = {
    animation: {
      duration: 1000,
      easingFunction: "easeInOutQuad",
    }
  };

  const focusOptions: any = {
    scale: 1.5,
    animation: {
      duration: 1000,
      easingFunction: "easeInOutQuad",
    }
  };

  const focusRandomNode = () => {
    console.log('focusRandomNode')
    console.log(attendees)
    if (!networkRef.current) return;

    const randomNode = attendees[Math.floor(Math.random() * attendees.length)];
    if (!randomNode || !randomNode.id) return;

    networkRef.current?.focus(randomNode.id, focusOptions);
    networkRef.current?.selectNodes([randomNode.id]);
  }

  useEffect(() => {
    const inter1 = setInterval(() => {
      if (!networkRef.current) return;

      if (Math.random() < 0.5) {
        focusRandomNode();
        console.log('focus');
      } else {
        networkRef.current?.unselectAll();
        networkRef.current?.fit(moveToOptions);
        networkRef.current?.startSimulation();
        console.log('fit');
      }
    }, 5000);

    // const inter2 = setInterval(() => {
    //   if (!networkRef.current) return;
    //   networkRef.current?.moveNode(attendees[Math.floor(Math.random() * attendees.length)].id, Math.random() * 100, Math.random() * 100);
    // }, 500);

    return () => {
      clearInterval(inter1);
      // clearInterval(inter2);
    }

  }, [attendees, connections]);


  return (
    <div>
      <Button onClick={focusRandomNode} className="fixed left-3 top-3 z-50">Focus Random Node</Button>
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
          <VisGraph ref={networkRef} graph={graphData} options={options} style={{ height: '100%', width: '100%' }} />
        </div>
      )}
    </div>
  );
}
