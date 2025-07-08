import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { useHouseStore } from '../../store'
import { init3D } from './init-3d'
import { init2D } from './init-2d'
import { Button } from 'antd'
import { GLTFLoader } from 'three/examples/jsm/Addons.js'
import SpriteText from 'three-spritetext'

async function loadWindow() {
  const group = new THREE.Group()
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('./window.glb')
  group.add(gltf.scene)

  const box = new THREE.Box3()
  box.expandByObject(gltf.scene)

  const size = box.getSize(new THREE.Vector3())

  return {
    model: group,
    size
  }
}

async function loadDoor() {
  const group = new THREE.Group()
  const loader = new GLTFLoader()
  const gltf = await loader.loadAsync('./door.glb')
  group.add(gltf.scene)

  const box = new THREE.Box3()
  box.expandByObject(gltf.scene)

  const size = box.getSize(new THREE.Vector3())

  return {
    model: group,
    size
  }
}

const textureLoader = new THREE.TextureLoader()
const floorTexture = textureLoader.load('./floor-texture.jpg')
floorTexture.colorSpace = THREE.SRGBColorSpace
floorTexture.wrapS = THREE.RepeatWrapping
floorTexture.wrapT = THREE.RepeatWrapping
floorTexture.repeat.set(0.002, 0.002)

function Main() {
  function wallsVisibilityCalc() {
    const camera = camera3DRef.current
    const scene = scene3DRef.current
    if (!camera) return

    data.walls.forEach((item, index) => {
      const cameraDirection = new THREE.Vector3()
      camera.getWorldDirection(cameraDirection)

      const wallDirection = new THREE.Vector3(
        item.normal.x,
        item.normal.y,
        item.normal.z
      )
      const obj = scene?.getObjectByName('wall' + index)
      if (!obj) return
      if (wallDirection.dot(cameraDirection) > 0) {
        obj.visible = false
      } else {
        obj.visible = true
      }
    })
  }

  const scene3DRef = useRef<THREE.Scene>(null)
  const scene2DRef = useRef<THREE.Scene>(null)
  const camera3DRef = useRef<THREE.Camera>(null)

  const { data } = useHouseStore()
  useEffect(() => {
    const scene1 = scene2DRef.current
    const scene2 = scene3DRef.current
    const house1 = scene1?.getObjectByName('house')
    const house2 = scene2?.getObjectByName('house')

    house1?.parent?.remove(house1)
    house2?.parent?.remove(house2)

    house1?.traverse((item) => {
      let obj = item as THREE.Mesh
      if (obj.isMesh) {
        obj.geometry.dispose()
      }
    })
  }, [data])

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
    if (dom) {
      const { scene, camera } = init3D(dom, wallsVisibilityCalc)
      scene3DRef.current = scene
      camera3DRef.current = camera
    }

    return () => {
      if (dom) {
        dom.innerHTML = ''
      }
    }
  }, [])
  // 2D绘制
  useEffect(() => {
    const scene = scene2DRef.current!
    const house = new THREE.Group()
    const walls = data.walls.map((item, index) => {
      const shape = new THREE.Shape()
      shape.moveTo(0, 0)
      shape.lineTo(0, item.depth)
      shape.lineTo(item.width, item.depth)
      shape.lineTo(item.width, 0)
      shape.lineTo(0, 0)

      item.windows?.forEach(async (win) => {
        const path = new THREE.Path()
        const { left } = win.leftBottomPosition
        path.moveTo(left, 0)
        path.lineTo(left, item.depth)
        path.lineTo(left + win.width, item.depth)
        path.lineTo(left + win.width, 0)
        path.lineTo(left, 0)
        shape.holes.push(path)
      })

      item.doors?.forEach(async (door) => {
        const path = new THREE.Path()
        const { left } = door.leftBottomPosition
        path.moveTo(left, 0)
        path.lineTo(left, item.depth)
        path.lineTo(left + door.width, item.depth)
        path.lineTo(left + door.width, 0)
        path.lineTo(left, 0)
        shape.holes.push(path)
      })

      const geometry = new THREE.ShapeGeometry(shape)
      const material = new THREE.MeshPhongMaterial({
        color: 'white',
        side: THREE.DoubleSide
      })
      const wall = new THREE.Mesh(geometry, material)

      item.windows?.forEach((win) => {
        const { left } = win.leftBottomPosition
        const geometry = new THREE.PlaneGeometry(win.width, item.depth)
        const material = new THREE.MeshBasicMaterial({
          color: '#aaa',
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
        const winLogo = new THREE.Mesh(geometry, material)
        winLogo.position.x = left + win.width / 2
        winLogo.position.y = 100
        wall.add(winLogo)
      })

      item.doors?.forEach((door) => {
        const { left } = door.leftBottomPosition

        const shape = new THREE.Shape()
        shape.moveTo(0, 0)
        shape.arc(0, 0, door.width, 0, Math.PI / 2)
        shape.lineTo(0, 0)
        const geometry = new THREE.ShapeGeometry(shape)
        const material = new THREE.MeshBasicMaterial({
          color: '#aaa',
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        })
        const doorLogo = new THREE.Mesh(geometry, material)
        doorLogo.position.x = left
        doorLogo.position.z = -100
        doorLogo.rotateX(Math.PI)
        doorLogo.position.y = 200

        wall.add(doorLogo)
      })

      wall.position.set(-item.position.x, -item.position.y, -item.position.z)
      const text = new SpriteText(item.width + '', 200)
      text.color = 'black'
      wall.add(text)
      text.position.x = item.width / 2
      text.position.y = 500
      text.position.z = -100

      const bufferGeometry = new THREE.BufferGeometry()
      bufferGeometry.setFromPoints([
        new THREE.Vector3(0, -100, 0),
        new THREE.Vector3(0, 100, 0),
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(item.width / 2 - 300, 0, 0),
        new THREE.Vector3(item.width / 2 + 300, 0, 0),
        new THREE.Vector3(item.width, 0, 0),
        new THREE.Vector3(item.width, -100, 0),
        new THREE.Vector3(item.width, 100, 0)
      ])

      const lineMaterial = new THREE.LineBasicMaterial({
        color: '#111'
      })
      const line = new THREE.LineSegments(bufferGeometry, lineMaterial)
      wall.add(line)
      line.position.z = -100
      line.position.y = 500

      if (item.rotationY) {
        wall.rotation.y = item.rotationY
      }
      wall.name = 'wall' + index
      wall.rotateX(-Math.PI / 2)
      wall.rotateY(Math.PI)
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
      floor.position.z = -200

      const text = new SpriteText(item.name + '\n' + item.size + 'm²', 200)
      text.color = 'black'
      const box3 = new THREE.Box3()
      box3.expandByObject(floor)
      const center = box3.getCenter(new THREE.Vector3())
      text.position.set(center.x, center.y, center.z)
      const helper = new THREE.Box3Helper(box3)
      floor.add(helper)
      floor.add(text)

      floor.rotateX(Math.PI / 2)
      floor.rotateZ(Math.PI)
      return floor
    })
    house.add(...floors)

    scene.add(house)
    const rad = THREE.MathUtils.degToRad(90)
    house.rotateY(rad)

    const box3 = new THREE.Box3()
    box3.expandByObject(house)

    const center = box3.getCenter(new THREE.Vector3())
    house.position.set(-center.x, 0, -center.z)
    house.name = 'house'
  }, [data])

  // 3D绘制
  useEffect(() => {
    const house = new THREE.Group()
    const scene = scene3DRef.current!
    const walls = data.walls.map((item, index) => {
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
      wall.name = 'wall' + index
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
      floor.position.y = 200
      floor.position.z = 200

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
    house.position.set(-center.x, 0, -center.z)
    house.name = 'house'
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
