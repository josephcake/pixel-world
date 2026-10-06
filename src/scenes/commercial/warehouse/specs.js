const WALL = {
  front: [[158, 164, 172], [142, 148, 156]],
  side: [[128, 134, 142], [112, 118, 126]],
};
const TRIM = [70, 76, 84];
const ROOF = {
  type: "flat",
  height: 0.4,
  fill: [96, 102, 110],
  front: [108, 114, 122],
  side: [84, 90, 98],
  edge: [58, 64, 72],
};
const WINDOW = { glass: [150, 190, 205], frame: [96, 102, 110], hi: [200, 224, 234] };
const SCENE = {
  grassA: [126, 128, 132],
  grassB: [138, 140, 144],
  grassEdge: [98, 100, 104],
  path: [150, 150, 152],
  pathEdge: [120, 120, 122],
};
const BASE = {
  top: [198, 199, 197],
  side: [180, 181, 179],
  edge: [160, 161, 159],
  lawn: [176, 178, 182],
  lawnEdge: [150, 152, 156],
};

const doors = (centers, halfW, z1) =>
  centers.map((cx) => ({ x0: cx - halfW, x1: cx + halfW, z0: 0, z1 }));

export const WAREHOUSE_SPECS = [
  {
    id: "warehouse-small",
    name: "Small Warehouse",
    w: 4,
    d: 2,
    plotMargin: 0,
    stories: 1,
    storyHeight: 2.5,
    wall: WALL,
    trim: TRIM,
    roof: ROOF,
    window: { front: 2, side: 1, ww: 0.5, wh: 0.4, zOff: 1.9, ...WINDOW },
    roller: doors([2], 0.8, 1.9),
    extraSky: 0,
    scene: SCENE,
    base: BASE,
  },
  {
    id: "warehouse-medium",
    name: "Medium Warehouse",
    w: 6,
    d: 2,
    plotMargin: 0,
    stories: 1,
    storyHeight: 2.5,
    wall: WALL,
    trim: TRIM,
    roof: ROOF,
    window: { front: 3, side: 1, ww: 0.5, wh: 0.4, zOff: 1.9, ...WINDOW },
    roller: doors([2, 4], 0.8, 1.9),
    extraSky: 0,
    scene: SCENE,
    base: BASE,
  },
  {
    id: "warehouse-large",
    name: "Large Warehouse",
    w: 6,
    d: 3,
    plotMargin: 0,
    stories: 1,
    storyHeight: 3,
    wall: WALL,
    trim: TRIM,
    roof: ROOF,
    window: { front: 4, side: 1, ww: 0.5, wh: 0.45, zOff: 2.2, ...WINDOW },
    roller: doors([1.2, 3, 4.8], 0.8, 2.2),
    extraSky: 0,
    scene: SCENE,
    base: BASE,
  },
  {
    id: "warehouse-mega",
    name: "Mega Warehouse",
    w: 8,
    d: 4,
    plotMargin: 0,
    stories: 1,
    storyHeight: 4,
    wall: WALL,
    trim: TRIM,
    roof: ROOF,
    window: { front: 6, side: 2, ww: 0.5, wh: 0.5, zOff: 2.8, ...WINDOW },
    roller: doors([1.2, 3.2, 4.8, 6.8], 0.8, 3),
    extraSky: 0,
    scene: SCENE,
    base: BASE,
  },
];
