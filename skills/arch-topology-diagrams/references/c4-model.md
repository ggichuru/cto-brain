# The C4 model — views, altitude, and Mermaid

C4 (by Simon Brown) describes software architecture at four nested zoom levels
plus two supplementary views. The discipline is **one level per diagram**: a
reader can always tell what altitude they're looking at, and you never force
them to hold two scales in their head at once.

## Table of contents
- [The five views](#the-five-views)
- [Level 1 — System Context](#level-1--system-context)
- [Level 2 — Container](#level-2--container)
- [Level 3 — Component](#level-3--component)
- [Deployment view](#deployment-view)
- [Dynamic / runtime view](#dynamic--runtime-view)
- [Choosing the spine for a deck](#choosing-the-spine-for-a-deck)

## The five views

| View | Audience | Shows | Hides |
|---|---|---|---|
| Context (L1) | everyone | the system as one box + who/what it talks to | all internals |
| Container (L2) | technical | the running/deployable units + how they talk | code-level detail |
| Component (L3) | developers of one container | modules inside one container | other containers |
| Deployment | ops/SRE | how containers map to infra, hosts, networks | application logic |
| Dynamic | everyone | the ordered steps of one scenario | everything not in that scenario |

Most decks need Context + Container + Deployment + one or two Dynamic flows.
Component (L3) is only worth drawing for a container complex enough to deserve
its own zoom — don't draw it for every service.

## Level 1 — System Context

The system is a single box. Around it: the people (actors) and external
systems it interacts with. No internals. This is the slide that orients a
reader who has never seen the system.

```mermaid
flowchart LR
  operator(["Operator<br/>(human)"]):::actor
  partner(["Partner / reviewer"]):::actor
  sys["The System<br/>(one box at L1)"]:::sys
  ext[("External service<br/>(e.g. registry)")]:::ext

  operator -->|"runs / controls"| sys
  partner  -->|"views results"| sys
  sys -->|"pulls images"| ext

  classDef actor fill:#e8eef7,stroke:#33415c,color:#11203b;
  classDef sys   fill:#d6e8d5,stroke:#2f6f3e,color:#10331a,stroke-width:2px;
  classDef ext   fill:#efe7d6,stroke:#8a6d2f,color:#3b2f10;
```

## Level 2 — Container

Each deployable/running unit is a box: services, datastores, proxies, batch
jobs. Edges are labeled with protocol + purpose. Group related units in
subgraphs. This is the workhorse slide.

```mermaid
flowchart TB
  subgraph edge["Access plane"]
    proxy["Reverse proxy / umbrella<br/>:8500"]:::svc
  end
  subgraph app["Application services"]
    a["service-a<br/>:8082"]:::svc
    b["service-b<br/>:8083"]:::svc
  end
  subgraph data["State + observability"]
    db[("redis / db")]:::store
    prom["prometheus<br/>:9095"]:::store
  end

  proxy -->|"HTTP /api/a"| a
  proxy -->|"HTTP /api/b"| b
  a -->|"state"| db
  a -->|"scrape /metrics"| prom

  classDef svc   fill:#d6e8d5,stroke:#2f6f3e,color:#10331a;
  classDef store fill:#e8eef7,stroke:#33415c,color:#11203b;
```

## Level 3 — Component

Inside ONE container: its modules/handlers and how a request flows through
them. Only draw this for a container that earns the zoom.

```mermaid
flowchart LR
  in["HTTP handler"] --> val["validate / authz"]
  val --> core["domain logic"]
  core --> repo["repository"]
  repo --> db[("store")]
```

## Deployment view

How containers land on real infrastructure: hosts, networks, the proxy
fan-out, which ports are exposed where. Use subgraphs for hosts/networks.
This is the view where *topology is the point* — the reverse-proxy sub-path
fan-out, the localhost-vs-tailnet duality, the per-subnet edge networks.

```mermaid
flowchart TB
  subgraph host["Single host (1× GPU box)"]
    direction TB
    um["umbrella :8500<br/>(tailnet HTTPS)"]:::net
    subgraph net1["bridge: app-net"]
      s1["nginx :8088"]:::svc
      s2["service :8082"]:::svc
    end
    subgraph net2["bridge: edge-net 10.46.0.0/16"]
      e1["edge-svc 10.46.1.10"]:::svc
    end
    um -->|"/app → :8088"| s1
    s1 --> s2
    s2 -.->|"breakout"| e1
  end
  classDef net fill:#efe7d6,stroke:#8a6d2f,color:#3b2f10,stroke-width:2px;
  classDef svc fill:#d6e8d5,stroke:#2f6f3e,color:#10331a;
```

## Dynamic / runtime view

One scenario, numbered steps. A `sequenceDiagram` is best when ordering and
request/response matter; a numbered `flowchart` when it's a pipeline. This is
the "how it runs" slide.

```mermaid
sequenceDiagram
  autonumber
  participant Src as video source
  participant Hub as RTSP hub
  participant W as worker
  participant Ev as evidence
  Src->>Hub: publish /degraded
  Hub->>W: subscribe /degraded
  W->>Hub: publish /sr (upscaled)
  Note over W: pauses when RAN under pressure
  Hub->>Ev: record on trigger
```

## Choosing the spine for a deck

- **"Show me the system"** → Context + Container.
- **"Show me how it's deployed / the topology"** → add Deployment.
- **"Show me how it runs / the flow"** → add one or two Dynamic views.
- **"Explain this one hairy service"** → add a Component view for it only.

Resist the urge to draw all five for every system. The right deck is the
fewest views that let the reader build a correct mental model.
