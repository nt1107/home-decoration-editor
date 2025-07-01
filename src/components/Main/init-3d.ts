import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function init3D(dom: HTMLElement) {
  const scene = new THREE.Scene()

  const axesHelper = new THREE.AxesHelper(5000)
  scene.add(axesHelper)

  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(500, 400, 300)
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff)
  scene.add(ambientLight)

  const width = window.innerWidth
  const height = window.innerHeight - 60

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 10000)
  camera.position.set(500, 1000, -500)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setClearColor('lightyellow')

  function render() {
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  render()

  dom.append(renderer.domElement)

  window.onresize = function () {
    const width = window.innerWidth
    const height = window.innerHeight - 60

    renderer.setSize(width, height)

    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  new OrbitControls(camera, renderer.domElement)

  return {
    scene
  }
}
