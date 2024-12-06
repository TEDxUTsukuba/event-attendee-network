"use client";

import { db } from "@/firebase/database";
import { pickupNQuestions } from "@/lib/question";
import { doc, collection, query, onSnapshot, addDoc } from "firebase/firestore";
import { useEffect, useState, useMemo, useRef, use } from "react";
import VisGraph, {
  GraphData,
  GraphEvents,
  Options,
  Node,
  Network,
} from 'react-vis-graph-wrapper';
import { toast } from "sonner"
import { useReward } from 'react-rewards';
import QRCode from "react-qr-code";


export default function VisualizeNetwork({
  params,
}: {
  params: { eventId: string };
}) {
  const { eventId } = params;
  const [attendees, setAttendees] = useState([] as any[]);
  const [connections, setConnections] = useState([] as any[]);
  const networkRef = useRef<Network | null>(null);
  const [locationOrigin, setLocationOrigin] = useState('' as string);
  const [timelapseMode, setTimelapseMode] = useState(false);
  const [currentConnectionIndex, setCurrentConnectionIndex] = useState(0);
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

  useEffect(() => {
    setLocationOrigin(location.origin);
  }, []);

  function getRandomColor() {
    const letters = '89ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 8)];
    }
    return color;
  }

  const sortedConnectionsData: { connections: any[] } = useMemo(() => {
    if (timelapseMode) {
      const sortedConnections = connections.sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, timelapseMode ? currentConnectionIndex + 1 : connections.length)

      return { connections: sortedConnections };
    } else {
      return { connections };
    }
  }, [connections, timelapseMode, currentConnectionIndex])

  const connectionAttendeesData = useMemo(() => {
    // connectionデータに対応するattendeeデータを取得して返す
    const { connections } = sortedConnectionsData;

    const connectionAttendees = connections.map((connection) => {
      const parent = attendees.find((attendee) => attendee.id === connection.parent_id);
      const child = attendees.find((attendee) => attendee.id === connection.child_id);

      return {
        id: connection.id,
        timestamp: connection.timestamp,
        parent,
        child,
      };
    }).reverse()

    return connectionAttendees;
  }, [sortedConnectionsData])

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
    const { connections } = sortedConnectionsData;

    // connectionの数が一番多いattendeeを取得
    const maxConnectionAttendeeId = connections.reduce((acc, connection) => {
      if (!acc[connection.parent_id]) {
        acc[connection.parent_id] = 0;
      }
      if (!acc[connection.child_id]) {
        acc[connection.child_id] = 0;
      }

      acc[connection.parent_id]++;
      acc[connection.child_id]++;

      return acc;
    }, {} as any);

    // top5のattendeeを取得
    const top5Attendees = Object.entries(maxConnectionAttendeeId)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    const nodes: Node[] = attendees.map((attendee) => ({
      id: attendee.id,
      label: attendee.name,
      shape: top5Attendees.includes(attendee.id) ? 'star' : 'dot',
      // label: "xxxxx",
      title: attendee.role,
      // valueはconnectionの数によって変える
      value: connections.filter((connection) => connection.parent_id === attendee.id).length / 10,
      // opacityはconnectionの数によって変える
      opacity: Math.min(0.6 + (connections.filter((c) => c.parent_id === attendee.id).length / attendees.length), 1),
      color: attendee.color || getRandomColor(),
    }));

    let edges = connections.map((connection) => ({
      id: connection.id,
      from: connection.parent_id,
      to: connection.child_id,
      width: 6 * (connections.filter((c) => c.parent_id === connection.parent_id).length / attendees.length),
      smooth: {
        enabled: true,
        type: 'dynamic',
        roundness: 0.5,
      }
    }));

    edges = edges.filter((edge) => edge.from !== edge.to);

    return {
      nodes,
      edges,
    };
  }, [attendees, sortedConnectionsData, timelapseMode, currentConnectionIndex]);

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
          scaleFactor: 1.05,
        },
      },
      width: 2.5,
    },
    nodes: {
      shape: "dot",
      scaling: {
        label: {
          min: 16,
          max: 18,
        },
      },
      font: {
        background: 'rgba(255,255,255,0.8)',
        size: 100,
      },
      color: {
        border: '#000000',
        background: '#666666',
        highlight: {
          border: '#fc5720',
          background: '#ffcc00',
        },
      },
      size: 20,
      labelHighlightBold: true,
    },
    height: '100%',
    physics: {
      enabled: true,
      solver: 'forceAtlas2Based',
      forceAtlas2Based: {
        gravitationalConstant: -100,
        centralGravity: 0.025,
        springLength: 120,
        springConstant: 0.1,
        avoidOverlap: 5,
      },
      maxVelocity: 150,
      minVelocity: 0.75,
      timestep: 0.1,
      stabilization: {
        enabled: true,
        iterations: 100000,
        updateInterval: 5000,
        onlyDynamicEdges: true,
        fit: true,
      },
      wind: {
        x: 1.0,
        y: 1.0,
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
    scale: 2.0,
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
    if (timelapseMode) return

    const inter1 = setInterval(() => {
      if (!networkRef.current) return;

      const random_num = Math.random();
      console.log(random_num);
      if (random_num < 0.02) {
        setTimelapseMode(true);
      } else if (random_num < 0.2) {
        focusRandomNode();
        console.log('focus');
      } else {
        networkRef.current?.unselectAll();
        networkRef.current?.fit(moveToOptions);
        networkRef.current?.startSimulation();
        console.log('fit');
      }
    }, 5000);

    return () => {
      clearInterval(inter1);
    }

  }, [attendees, connections, timelapseMode]);

  useEffect(() => {
    if (!timelapseMode) return;

    const interval = setInterval(() => {
      setCurrentConnectionIndex((prevIndex) => {
        if (prevIndex < connections.length - 1) {
          return prevIndex + 1;
        } else {
          setTimelapseMode(false);
          return 0;
        }
      });
    }, 150);

    return () => {
      clearInterval(interval);
    };
  }, [timelapseMode, connections]);

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
      {timelapseMode && <p className="fixed top-3 left-1/2 -translate-x-1/2 text-3xl font-bold">タイムラプスモード</p>}
      {/* <div className="fixed left-3 top-3 z-50 flex flex-col gap-3">
        <Button onClick={() => setTimelapseMode(!timelapseMode)}>
          {timelapseMode ? 'タイムラプスモード終了' : 'タイムラプスモード開始'}
        </Button>
      </div> */}
      {/* <div className="fixed right-3 top-3 z-50 max-h-[30vh] overflow-scroll text-right">
        {connectionAttendeesData.map((connection, index) => (
          <div key={connection.id} style={{ fontSize: `${1.5 - 0.2 * Math.min(index, 5)}rem`, opacity: 1.2 - index / connectionAttendeesData.length }} className="transform duration-75">
            {connection.parent.name} → {connection.child.name}
          </div>))}
      </div> */}
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
      <div className="fixed bottom-3 right-3 flex gap-2">
        <div className="p-1">
          {locationOrigin && (
            <QRCode value={`${locationOrigin}/event/${eventId}/register`} className="w-[10vw] h-[10vw]" />
          )}
        </div>
        <p className="text-center text-xs pt-1" style={{ writingMode: "vertical-rl" }}>QRコードをスキャンして参加</p>
      </div>
    </div>
  );
}
