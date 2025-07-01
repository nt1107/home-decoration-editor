import { create } from 'zustand'

interface Wall {
  position: { x: number; y: number; z: number }
  width: number
  height: number
  depth: number
  windows: [
    {
      leftBottomPosition: {
        x: number
        z: number
      }
      width: number
      height: number
    }
  ]
}

interface State {
  data: {
    walls: Array<Wall>
  }
}

const useHouseStore = create<State>((set, get) => {
  return {
    data: {
      walls: [
        {
          position: { x: 0, y: 0, z: 0 },
          width: 500,
          height: 500,
          depth: 30,
          windows: [
            {
              leftBottomPosition: {
                x: 100,
                z: 100
              },
              width: 300,
              height: 300
            }
          ]
        },
        {
          position: { x: 0, y: 0, z: 800 },
          width: 500,
          height: 500,
          depth: 30,
          windows: [
            {
              leftBottomPosition: {
                x: 100,
                z: 100
              },
              width: 300,
              height: 300
            }
          ]
        }
      ]
    }
  }
})

export { useHouseStore }
