import * as THREE from 'three'
import { MapControls } from 'three/examples/jsm/Addons.js'

export function init2D(dom: HTMLElement) {
  const scene = new THREE.Scene()

  const axesHelper = new THREE.AxesHelper(50000)
  scene.add(axesHelper)

  const directionalLight = new THREE.DirectionalLight(0xffffff)
  directionalLight.position.set(500, 400, 300)
  scene.add(directionalLight)

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.5)
  scene.add(ambientLight)

  const width = window.innerWidth
  const height = window.innerHeight - 60

  const camera = new THREE.PerspectiveCamera(60, width / height, 1, 100000)
  camera.position.set(0, 10000, 0)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true
  })
  renderer.setSize(width, height)
  renderer.setClearColor('lightblue')

  dom.append(renderer.domElement)

  window.onresize = function () {
    const width = window.innerWidth
    const height = window.innerHeight - 60

    renderer.setSize(width, height)

    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  const controls = new MapControls(camera, renderer.domElement)
  controls.enableRotate = false

  function render() {
    controls.update()
    renderer.render(scene, camera)
    requestAnimationFrame(render)
  }

  render()

  return {
    scene
  }
}
