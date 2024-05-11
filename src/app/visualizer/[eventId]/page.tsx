"use client";

import { Button } from "@/components/ui/button";
import { db } from "@/firebase/database";
import { pickupNQuestions } from "@/lib/question";
import { doc, collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { useEffect, useState, useMemo, useRef } from "react";
import VisGraph, {
  GraphData,
  GraphEvents,
  Options,
  Node,
  Network,
} from 'react-vis-graph-wrapper';
import { toast } from "sonner"
import { useReward } from 'react-rewards';


export default function VisualizeNetwork({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const [attendees, setAttendees] = useState([] as any[]);
  const [connections, setConnections] = useState([] as any[]);
  const networkRef = useRef<Network | null>(null);
  const { reward, isAnimating } = useReward('correctAni', 'confetti', {
    elementCount: 100,
    elementSize: 20,
    spread: 150,
    decay: 0.9,
    lifetime: 200,
  });
  const { reward: connectionReward, isAnimating: isConnectionAnimating } = useReward('connectionAni', 'emoji', {
    emoji: ['🙌', '🤝', '🎉', '✨', '🎵'],
    elementCount: 50,
    elementSize: 20,
    spread: 200,
    decay: 0.9,
    lifetime: 200,
  });

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
    var attendeesDataCache: any[] = [];

    // attendeesのリアルタイム取得
    const attendeesQuery = query(collection(eventRef, 'attendees'));
    const unsubscribeAttendees = onSnapshot(attendeesQuery, (snapshot) => {
      const attendeesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log(attendeesData);
      setAttendees(attendeesData);
      attendeesDataCache = attendeesData;

      const addedChanges = snapshot.docChanges().filter((change) => change.type === "added");

      if (addedChanges.length != snapshot.docs.length) {
        addedChanges.forEach((change) => {
          const attendee = change.doc.data();
          toast.info(`${attendee.name}が参加しました！`);

          if (networkRef.current) {
            setTimeout(() => {
              try {
                networkRef.current?.stopSimulation();
                networkRef.current?.focus(change.doc.id, focusOptions);
                networkRef.current?.selectNodes([change.doc.id]);
                reward();
                setTimeout(() => {
                  networkRef.current?.fit(moveToOptions);
                  networkRef.current?.startSimulation();
                }, 1000);
              } catch (e) {
                console.error(e);
              }
            }, 500);
          }
        });

      }

    });

    // connectionsのリアルタイム取得
    const connectionsQuery = query(collection(eventRef, 'connections'));
    const unsubscribeConnections = onSnapshot(connectionsQuery, (snapshot) => {
      const connectionsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      console.log(connectionsData);
      setConnections(connectionsData);

      const addedChanges = snapshot.docChanges().filter((change) => change.type === "added");

      if (addedChanges.length != snapshot.docs.length) {
        addedChanges.forEach((change) => {
          const connection = change.doc.data();

          if (!connection.parent_id || !connection.child_id || connection.parent_id === connection.child_id) return;

          const parent = attendeesDataCache.find((attendee) => attendee.id === connection.parent_id);
          const child = attendeesDataCache.find((attendee) => attendee.id === connection.child_id);

          toast.success(`${parent?.name}が${child?.name}と繋がりました！`);

          if (networkRef.current) {
            setTimeout(() => {
              networkRef.current?.selectEdges([change.doc.id]);
              connectionReward();

              setTimeout(() => {
                networkRef.current?.stopSimulation();
                networkRef.current?.focus(connection.parent_id, focusOptions);

                setTimeout(() => {
                  networkRef.current?.fit(moveToOptions);
                  networkRef.current?.startSimulation();
                }, 1500);
              }, 500);
            }, 500);
          }
        });
      }
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
      color: attendee.color || getRandomColor(),
    }));

    let edges = connections.map((connection) => ({
      id: connection.id,
      from: connection.parent_id,
      to: connection.child_id,
    }));

    edges = edges.filter((edge) => edge.from !== edge.to);

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
      zoomView: true,
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

      if (Math.random() < 0.2) {
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

  const debugRandomAddNode = async () => {
    const name = Math.random().toString(36).slice(-8);
    const role = Math.random().toString(36).slice(-8);
    const attendeeRef = collection(doc(db, 'events', eventId as string), 'attendees');

    const questions = pickupNQuestions(3);

    //questionsをdictionaryに変換{question1: "hogehoge", question2: "fugafuga", question3: "piyopiyo"}
    const questionsDict = questions.reduce((acc, question, index) => {
      acc[question] = Math.random().toString(36).slice(-8);
      return acc;
    }, {} as any);

    await addDoc(attendeeRef, {
      name,
      role,
      info: questionsDict
    });
  }

  const debugRandomAddConnection = async () => {
    const parent_id = attendees[Math.floor(Math.random() * attendees.length)].id;
    const child_id = attendees[Math.floor(Math.random() * attendees.length)].id;
    const connectionRef = collection(doc(db, 'events', eventId as string), 'connections');

    await addDoc(connectionRef, {
      parent_id,
      child_id,
      timestamp: new Date(),
    });
  }


  return (
    <div>
      {/* <div className="fixed left-3 top-3 z-50 flex flex-col gap-3">
        <Button onClick={focusRandomNode}>Focus Random Node</Button>
        <Button onClick={debugRandomAddNode}>Debug Random Add Node</Button>
        <Button onClick={debugRandomAddConnection}>Debug Random Add Connection</Button>
      </div> */}
      {/* <h1>Event: {eventId}</h1>
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
      </ul> */}
      {attendees.length === 0 && <p className="text-3xl font-bold fixed top-3 left-1/2 -translate-x-1/2">まだ誰も参加してません😭</p>}
      {graphData.nodes.length > 0 && (
        <div className="h-screen w-screen fixed left-0 top-0">
          <VisGraph ref={networkRef} graph={graphData} options={options} style={{ height: '100%', width: '100%' }} />
        </div>
      )}
      <span id="correctAni" className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></span>
      <span id="connectionAni" className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"></span>
    </div>
  );
}
