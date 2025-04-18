/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import "./tree.css"
import defaultData from "../../data/worksOfRamanujacharya"
import { useDispatch } from "react-redux"
import { setAdhyaya, setPada, setAdhikarna, setSutra } from "@/features/sri-bhasyam/redux/sriBhashyamMetaDataSlice"

interface Data {
  name: string
  glug?: [number, number, number]
  children?: Work[]
}

interface TreeProps {
  treeData: Data
}

export default function SriBhashyamTree({ treeData }: TreeProps) {
  const svgRef = useRef(null)

  const dispatch = useDispatch()


  const [data, setData] = useState(treeData)

  useEffect(() => {
    const margin = { top: 10, right: 10, bottom: 10, left: 200 }
    const width = 1200 - margin.left - margin.right
    const height = 600 - margin.bottom

    d3.select("#tree").select("svg").remove()

    const svg = d3
      .select("#tree")
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    let i = 0
    const duration = 750

    const treeLayout = d3.tree().size([height, width])

    const root = d3.hierarchy(data, (d) => d.children)

    root.x0 = height / 2
    root.y0 = 0

    const collapse = (d) => {
      if (d.children) {
        d._children = d.children
        d._children.forEach(collapse)
        d.children = null
      }
    }

    root.children.forEach(collapse)
    collapse(root)

    const update = (source) => {
      const treeData = treeLayout(root)

      const nodes = treeData.descendants()
      const links = treeData.descendants().slice(1)

      nodes.forEach((d) => (d.y = d.depth * 180))

      const node = svg
        .selectAll("g.node")
        .data(nodes, (d) => d.id || (d.id = ++i))

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${source.y0},${source.x0})`)
        .on("click", (event, d) => click(d))

      nodeEnter
        .append("circle")
        .attr("class", "node")
        .attr("r", 1e-6)
        .style("fill", (d) => (d._children ? "#9D8177" : "#C9A89C"))
        .attr("cursor", "pointer")

      nodeEnter
        .append("a")
        .attr("href", (d) => {
          if(d.data.glug){
            return "/ramanujacharya/sri-bhashyam/sutras"
          }else{
            return "#"
          }
        })
        .on("click", (event, d) =>{
          if (d.data.glug) {
            dispatch(setAdhyaya(d.data.glug[0]))
            dispatch(setPada(d.data.glug[1]))
            dispatch(setAdhikarna(d.data.glug[2]))
          }
        })
        .append("text")
        .attr("dy", ".35em")
        .attr("x", (d) => (d.children || d._children ? -13 : 13))
        .attr("text-anchor", (d) =>
          d.children || d._children ? "end" : "start"
        )
        .text((d) => d.data.name)
        .attr("fill", "#000000") // Set the text color here

      const nodeUpdate = nodeEnter.merge(node)

      nodeUpdate
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)

      nodeUpdate
        .select("circle.node")
        .attr("r", 10)
        .style("fill", (d) => (d._children ? "#B59589" : "#C9A89C"))
        .attr("cursor", "pointer")

      const nodeExit = node
        .exit()
        .transition()
        .duration(duration)
        .attr("transform", (d) => `translate(${source.y},${source.x})`)
        .remove()

      nodeExit.select("circle").attr("r", 1e-6)
      nodeExit.select("text").style("fill-opacity", 1e-6)

      const diagonal = (s, d) => {
        const path = `M ${s.y} ${s.x}
            C ${(s.y + d.y) / 2} ${s.x},
              ${(s.y + d.y) / 2} ${d.x},
              ${d.y} ${d.x}`

        return path
      }

      const link = svg.selectAll("path.link").data(links, (d) => d.id)

      const linkEnter = link
        .enter()
        .insert("path", "g")
        .attr("class", "link")
        .attr("d", (d) => {
          const o = { x: source.x0, y: source.y0 }
          return diagonal(o, o)
        })

      const linkUpdate = linkEnter.merge(link)

      linkUpdate
        .transition()
        .duration(duration)
        .attr("d", (d) => diagonal(d, d.parent))

      const linkExit = link
        .exit()
        .transition()
        .duration(duration)
        .attr("d", (d) => {
          const o = { x: source.x, y: source.y }
          return diagonal(o, o)
        })
        .remove()

      nodes.forEach((d) => {
        d.x0 = d.x
        d.y0 = d.y
      })
    }

    const click = (d) => {
      if (d.children) {
        d._children = d.children
        d.children = null
      } else {
        d.children = d._children
        d._children = null
      }
      update(d)
    }

    update(root)
  }, [data])

  return (
    <div id="tree">
      <svg ref={svgRef}></svg>
    </div>
  )
}
