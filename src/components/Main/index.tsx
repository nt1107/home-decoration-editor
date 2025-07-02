import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHouseStore } from '../../store'
import { init3D } from './init-3d'
import { init2D } from './init-2d'
import { Button } from 'antd'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'

let winModel: { model: THREE.Group; size: THREE.Vector3 } | null = null

async function loadWindow() {
  if (winModel !== null) {
    return winModel
  } else {
    const group = new THREE.Group()
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync('./window.glb')
    group.add(gltf.scene)

    const box = new THREE.Box3()
    box.expandByObject(gltf.scene)

    const size = box.getSize(new THREE.Vector3())
    winModel = {
      model: group,
      size
    }

    return winModel
  }
}

let doorModel: { model: THREE.Group; size: THREE.Vector3 } | null = null

async function loadDoor() {
  if (doorModel !== null) {
    return doorModel
  } else {
    const group = new THREE.Group()
    const loader = new GLTFLoader()
    const gltf = await loader.loadAsync('./door.glb')
    group.add(gltf.scene)

    const box = new THREE.Box3()
    box.expandByObject(gltf.scene)

    const size = box.getSize(new THREE.Vector3())
    doorModel = {
      model: group,
      size
    }

    return doorModel
  }
}

const textureLoader = new THREE.TextureLoader()
const floorTexture = textureLoader.load('./floor-texture.jpg')
floorTexture.colorSpace = THREE.SRGBColorSpace
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(0.002, 0.002)

function Main() {
  const scene3DRef = useRef<THREE.Scene>(null)
  const scene2DRef = useRef<THREE.Scene>(null)
  const { data } = useHouseStore()

  // 2D容器
  useEffect(() => {
    const dom = document.getElementById('threejs-2d-container')
    if (dom) {
      const { scene } = init2D(dom)
      scene2DRef.current = scene
    }
    return () => {
      if (dom) {
        dom.innerHTML = ''
      }
    }
  }, [])
  // 3D容器
  useEffect(() => {
    const dom = document.getElementById('threejs-3d-container')
    // const { scene } = dom ? init3D(dom) : { scene: null }
    if (dom) {
      const { scene } = init3D(dom)
      scene3DRef.current = scene
    }

    return () => {
      if (dom) {
        dom.innerHTML = ''
      }
    }
  }, [])
  // 2D绘制
  useEffect(() => {
    // const scene = scene2DRef.current!
    // const walls = data.walls.map((item) => {
    //   const shape = new THREE.Shape()
    //   shape.moveTo(item.p1.x, item.p1.z)
    //   shape.lineTo(item.p2.x, item.p2.z)
    //   shape.lineTo(item.p3.x, item.p3.z)
    //   shape.lineTo(item.p4.x, item.p4.z)
    //   shape.lineTo(item.p1.x, item.p1.z)
    //   const geometry = new THREE.ShapeGeometry(shape)
    //   const material = new THREE.MeshPhongMaterial({
    //     color: 'white'
    //   })
    //   const wall = new THREE.Mesh(geometry, material)
    //   wall.rotateX(-Math.PI / 2)
    //   return wall
    // })
    // scene.add(...walls)
  }, [data])
  // 3D绘制
  useEffect(() => {
    const house = new THREE.Group()
    const scene = scene3DRef.current!
    const walls = data.walls.map((item) => {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(0, item.height)
      shape.lineTo(item.width, item.height)
      shape.lineTo(item.width, 0)
      shape.lineTo(0, 0)

      item.windows.forEach(async (win) => {
        const path = new THREE.Path()
        const { left, bottom } = win.leftBottomPosition
        path.moveTo(left, bottom)
        path.lineTo(left + win.width, bottom)
        path.lineTo(left + win.width, bottom + win.height)
        path.lineTo(left, bottom + win.height)
        path.lineTo(left, bottom)
        shape.holes.push(path)

        const { model, size } = await loadWindow()
        model.position.x = win.leftBottomPosition.left + win.width / 2
        model.position.y = win.leftBottomPosition.bottom + win.height / 2
        model.scale.set(win.width / size.x, win.height / size.y, 1)
        wall.add(model)
      })

      item.doors?.forEach(async (door) => {
        const path = new THREE.Path()
        const { left, bottom } = door.leftBottomPosition
        path.moveTo(left, bottom)
        path.lineTo(left + door.width, bottom)
        path.lineTo(left + door.width, bottom + door.height)
        path.lineTo(left, bottom + door.height)
        path.lineTo(left, bottom)
        shape.holes.push(path)

        const { model, size } = await loadDoor()
        model.scale.y = door.height / size.y
        model.scale.z = door.width / size.z
        model.rotateY(Math.PI / 2)
        model.position.x = door.leftBottomPosition.left + door.width / 2
        model.position.y = door.leftBottomPosition.bottom + door.height / 2
        wall.add(model)
      })

      const geometry = new THREE.ExtrudeGeometry(shape, {
        depth: item.depth
      })
      const material = new THREE.MeshPhongMaterial({
        color: 'white'
      })
      const wall = new THREE.Mesh(geometry, material)
      // wall.rotateX(-Math.PI / 2)
      wall.position.set(item.position.x, item.position.y, item.position.z)
      if (item.rotationY) {
        wall.rotation.y = item.rotationY
      }

      return wall
    })

    house.add(...walls)

    const floors = data.floors.map((item) => {
      const shape = new THREE.Shape()
      shape.moveTo(item.points[0].x, item.points[0].z)
      for (let i = 1; i < item.points.length; i++) {
        shape.lineTo(item.points[i].x, item.points[i].z)
      }

      let texture = floorTexture

      if (item.textureUrl) {
        texture = textureLoader.load(item.textureUrl)
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(0.002, 0.002)
      }

      const geometry = new THREE.ShapeGeometry(shape)
      const material = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.BackSide
      })
      const floor = new THREE.Mesh(geometry, material)
      floor.rotateX(Math.PI / 2)
      return floor
    })
    house.add(...floors)

    const ceilings = data.ceilings.map((item) => {
      const shape = new THREE.Shape()
      shape.moveTo(item.points[0].x, item.points[0].z)
      for (let i = 1; i < item.points.length; i++) {
        shape.lineTo(item.points[i].x, item.points[i].z)
      }

      const geometry = new THREE.ShapeGeometry(shape)
      const material = new THREE.MeshPhongMaterial({
        color: '#eee',
        side: THREE.FrontSide
      })
      const ceiling = new THREE.Mesh(geometry, material)
      ceiling.rotateX(Math.PI / 2)
      ceiling.position.y = item.height
      return ceiling
    })
    house.add(...ceilings)

    scene.add(house)

    const box3 = new THREE.Box3()
    box3.expandByObject(house)
    const center = box3.getCenter(new THREE.Vector3())
    house.position.set(-center.x, -center.y, -center.z)
  }, [data])

  const [curMode, setCurMode] = useState('2d')

  return (
    <div className="Main">
      <div
        id="threejs-3d-container"
        style={{ display: curMode === '3d' ? 'block' : 'none' }}
      ></div>
      <div
        id="threejs-2d-container"
        style={{ display: curMode === '2d' ? 'block' : 'none' }}
      ></div>

      <div className="mode-change-btns">
        <Button
          type={curMode === '2d' ? 'primary' : 'default'}
          onClick={() => setCurMode('2d')}
        >
          2D
        </Button>
        <Button
          type={curMode === '3d' ? 'primary' : 'default'}
          onClick={() => setCurMode('3d')}
        >
          3D
        </Button>
      </div>
    </div>
  )
}

export default Main
