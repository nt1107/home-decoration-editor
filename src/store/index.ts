import { create } from 'zustand'
import data from './house2'

interface Wall {
  position: { x: number; y: number; z: number }
  width: number
  height: number
  depth: number
  rotationY?: number
  normal: { x: number; y: number; z: number }
  windows: Array<{
    leftBottomPosition: {
      left: number
      bottom: number
    }
    width: number
    height: number
  }>
  doors?: Array<{
    leftBottomPosition: {
      left: number
      bottom: number
    }
    width: number
    height: number
  }>
}
interface Floor {
  points: Array<{
    x: number
    z: number
  }>
  textureUrl?: string
  name?: string
  size?: number
}
interface Ceiling {
  points: Array<{
    x: number
    z: number
  }>
  height: number
}

export interface State {
  data: {
    walls: Array<Wall>
    floors: Array<Floor>
    ceilings: Array<Ceiling>
  }
}

export interface Action {
  setData(data: State['data']): void
}

const useHouseStore = create<State>((set) => {
  return {
    data,
    setData(data: State['data']) {
      set((state) => {
        return {
          ...state,
          data: data
        }
      })
    }
  }
})

export { useHouseStore }
