"""
Spider Engine — Blender Real-Time MCP Bridge Server
Runs inside Blender 3D (GUI or Headless/Background mode)
Listens on 127.0.0.1:9876 to execute procedural 3D generation, Python scripting,
and real-time GLTF/GLB asset syncing with Spider Game Engine.

Architecture: Main-thread event multiplexer via select() ensuring 100% thread-safe
access to Blender's bpy.context, view_layer, and glTF exporter.
"""

import socket
import select
import json
import sys
import io
import os
import traceback

try:
    import bpy
    HAS_BPY = True
except ImportError:
    HAS_BPY = False

HOST = "127.0.0.1"
PORT = 9876

def get_active_object():
    """Returns active object across GUI and background/headless modes."""
    if not HAS_BPY:
        return None
    obj = getattr(bpy.context, 'active_object', None)
    if not obj and hasattr(bpy.context, 'view_layer'):
        obj = getattr(bpy.context.view_layer.objects, 'active', None)
    return obj

def execute_blender_command(command, data):
    """Executes commands on Blender's main thread with full context."""
    if not HAS_BPY:
        return {"ok": False, "error": "bpy module not found. Run inside Blender."}

    cmd = (command or "").strip().lower()

    if cmd == "ping":
        obj_names = [o.name for o in bpy.data.objects][:30]
        return {
            "ok": True,
            "status": "online",
            "blender_version": bpy.app.version_string,
            "active_scene": bpy.context.scene.name if bpy.context.scene else "None",
            "object_count": len(bpy.data.objects),
            "objects": obj_names
        }

    elif cmd in ("run_script", "exec", "python"):
        code = data.get("code") or data.get("script") or ""
        if not code:
            return {"ok": False, "error": "No Python code provided"}

        old_stdout = sys.stdout
        old_stderr = sys.stderr
        redirected_output = io.StringIO()
        sys.stdout = redirected_output
        sys.stderr = redirected_output

        exec_globals = {
            "bpy": bpy,
            "context": bpy.context,
            "data": bpy.data,
            "get_active_object": get_active_object
        }
        try:
            exec(code, exec_globals)
            output = redirected_output.getvalue()
            return {
                "ok": True,
                "output": output or "Script executed successfully.",
                "total_objects": len(bpy.data.objects)
            }
        except Exception as e:
            err = traceback.format_exc()
            return {"ok": False, "error": str(e), "traceback": err}
        finally:
            sys.stdout = old_stdout
            sys.stderr = old_stderr

    elif cmd == "spawn_mesh":
        mesh_type = (data.get("type") or "cube").lower()
        location = data.get("location", [0, 0, 0])
        scale = data.get("scale", [1, 1, 1])
        name = data.get("name", f"Spider_{mesh_type.capitalize()}")

        try:
            if mesh_type in ("monkey", "suzanne"):
                bpy.ops.mesh.primitive_monkey_add(location=location)
            elif mesh_type in ("sphere", "uv_sphere"):
                bpy.ops.mesh.primitive_uv_sphere_add(location=location)
            elif mesh_type == "cylinder":
                bpy.ops.mesh.primitive_cylinder_add(location=location)
            elif mesh_type == "torus":
                bpy.ops.mesh.primitive_torus_add(location=location)
            elif mesh_type == "plane":
                bpy.ops.mesh.primitive_plane_add(location=location)
            elif mesh_type == "cone":
                bpy.ops.mesh.primitive_cone_add(location=location)
            else:
                bpy.ops.mesh.primitive_cube_add(location=location)

            obj = get_active_object()
            if obj:
                obj.name = name
                obj.scale = scale
                color = data.get("color")
                if color:
                    mat = bpy.data.materials.new(name=f"{name}_Mat")
                    mat.use_nodes = True
                    nodes = mat.node_tree.nodes
                    bsdf = nodes.get("Principled BSDF")
                    if bsdf:
                        if isinstance(color, str) and color.startswith("#"):
                            c = color.lstrip("#")
                            rgb = tuple(int(c[i:i+2], 16)/255.0 for i in (0, 2, 4))
                            bsdf.inputs["Base Color"].default_value = (rgb[0], rgb[1], rgb[2], 1.0)
                        elif isinstance(color, (list, tuple)) and len(color) >= 3:
                            bsdf.inputs["Base Color"].default_value = (color[0], color[1], color[2], 1.0)
                    obj.data.materials.append(mat)

            return {
                "ok": True,
                "message": f"Spawned {name} ({mesh_type})",
                "object_name": obj.name if obj else name,
                "location": location,
                "total_objects": len(bpy.data.objects)
            }
        except Exception as e:
            return {"ok": False, "error": str(e)}

    elif cmd == "export_glb":
        filepath = data.get("filepath")
        if not filepath:
            engine_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
            filepath = os.path.join(engine_root, "public", "assets", "blender_sync.glb")

        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        try:
            win = None
            if hasattr(bpy.context, 'window_manager') and len(bpy.context.window_manager.windows) > 0:
                win = bpy.context.window_manager.windows[0]
            
            active_obj = get_active_object() or (bpy.data.objects[0] if len(bpy.data.objects) > 0 else None)
            objs = list(bpy.data.objects)
            override_kwargs = {}
            if win:
                override_kwargs['window'] = win
            if active_obj:
                override_kwargs['active_object'] = active_obj
            if objs:
                override_kwargs['selected_objects'] = objs

            if hasattr(bpy.context, 'temp_override') and override_kwargs:
                with bpy.context.temp_override(**override_kwargs):
                    bpy.ops.export_scene.gltf(
                        filepath=filepath,
                        export_format="GLB",
                        use_selection=data.get("selected_only", False)
                    )
            else:
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    export_format="GLB",
                    use_selection=data.get("selected_only", False)
                )

            file_size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
            return {
                "ok": True,
                "message": f"Exported scene to GLB ({file_size} bytes)",
                "filepath": filepath,
                "filename": os.path.basename(filepath),
                "size_bytes": file_size
            }
        except Exception as e:
            return {"ok": False, "error": str(e)}

    elif cmd == "clear_scene":
        try:
            bpy.ops.object.select_all(action='SELECT')
            bpy.ops.object.delete(use_global=False)
            return {"ok": True, "message": "Cleared all objects in scene"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    elif cmd == "get_scene":
        objs = []
        for o in bpy.data.objects:
            objs.append({
                "name": o.name,
                "type": o.type,
                "location": [round(v, 3) for v in o.location],
                "visible": getattr(o, "visible_get", lambda: True)()
            })
        return {"ok": True, "scene": bpy.context.scene.name if bpy.context.scene else "None", "objects": objs}

    return {"ok": False, "error": f"Unknown command '{command}'"}

def run_main_loop(port=PORT):
    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind((HOST, port))
    server.listen(5)
    server.setblocking(False)

    print(f"=====================================================")
    print(f"🟢 SPIDER ENGINE — BLENDER REAL-TIME MCP BRIDGE ONLINE")
    print(f"   Listening on: {HOST}:{port}")
    print(f"   Blender Version: {bpy.app.version_string if HAS_BPY else 'Standalone'}")
    print(f"=====================================================")
    sys.stdout.flush()

    inputs = [server]
    buffers = {}

    try:
        while True:
            readable, _, exceptional = select.select(inputs, [], inputs, 0.1)
            for s in readable:
                if s is server:
                    client_sock, client_addr = server.accept()
                    client_sock.setblocking(False)
                    inputs.append(client_sock)
                    buffers[client_sock] = ""
                else:
                    try:
                        chunk = s.recv(4096)
                        if chunk:
                            buffers[s] += chunk.decode('utf-8')
                            while "\n" in buffers[s]:
                                line, buffers[s] = buffers[s].split("\n", 1)
                                line = line.strip()
                                if not line:
                                    continue
                                try:
                                    req = json.loads(line)
                                    req_id = req.get("id")
                                    command = req.get("command")
                                    cmd_data = req.get("data", {})
                                    res = execute_blender_command(command, cmd_data)
                                    if req_id is not None:
                                        res["id"] = req_id
                                except Exception as ex:
                                    res = {"ok": False, "error": f"Execution error: {str(ex)}"}
                                
                                response_bytes = (json.dumps(res) + "\n").encode("utf-8")
                                s.sendall(response_bytes)
                        else:
                            if s in inputs:
                                inputs.remove(s)
                            if s in buffers:
                                del buffers[s]
                            s.close()
                    except Exception as e:
                        if s in inputs:
                            inputs.remove(s)
                        if s in buffers:
                            del buffers[s]
                        try:
                            s.close()
                        except:
                            pass

            for s in exceptional:
                if s in inputs:
                    inputs.remove(s)
                if s in buffers:
                    del buffers[s]
                try:
                    s.close()
                except:
                    pass
    except KeyboardInterrupt:
        print("[Blender MCP] Server stopped by user.")
    finally:
        server.close()

if __name__ == "__main__":
    run_main_loop(PORT)
