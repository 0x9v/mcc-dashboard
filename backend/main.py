from fastapi import FastAPI, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import asyncio

# Define your secret key here
SECRET_API_KEY = "operator_v6_secure"


async def verify_api_key(x_api_key: str = Header(None)):
    if x_api_key != SECRET_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized execution attempt.")


# Apply the security check to EVERY route globally
app = FastAPI(title="MCC Dashboard Engine", dependencies=[Depends(verify_api_key)])

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def check_instance_status(instance_name: str) -> str:
    session = f"mcc-{instance_name}"
    check = subprocess.run(["tmux", "has-session", "-t", session], capture_output=True)
    if check.returncode != 0:
        return "stopped"

    log_check = subprocess.run(
        ["tmux", "capture-pane", "-t", session, "-p", "-S", "-5"],
        capture_output=True,
        text=True,
    )
    logs = log_check.stdout.lower()

    if (
        "disconnected" in logs
        or "login failed" in logs
        or "not connected" in logs
        or "error" in logs
    ):
        return "crashed"

    return "active"


@app.get("/api/instances")
async def get_instances():
    target_instances = ["main", "kanno"]
    status_list = []
    for inst in target_instances:
        current_status = await check_instance_status(inst)
        status_list.append({"name": inst, "status": current_status})
    return {"instances": status_list}


@app.get("/api/inventory/{instance_name}")
async def get_inventory(instance_name: str):
    from parsers import parse_inventory

    session = f"mcc-{instance_name}"

    check = await check_instance_status(instance_name)
    if check != "active":
        return {"error": f"Instance {instance_name} is not active."}

    subprocess.run(
        ["tmux", "send-keys", "-t", session, "/inventory player list", "ENTER"]
    )
    await asyncio.sleep(1.0)

    log_check = subprocess.run(
        ["tmux", "capture-pane", "-t", session, "-p", "-S", "-50"],
        capture_output=True,
        text=True,
    )

    parsed_items = parse_inventory(log_check.stdout)
    return {"inventory": parsed_items}


@app.post("/api/instances/{instance_name}/start")
async def start_instance(instance_name: str):
    session = f"mcc-{instance_name}"
    check = await check_instance_status(instance_name)
    if check == "active":
        return {"message": f"{instance_name} is already running."}

    subprocess.run(["tmux", "new-session", "-d", "-s", session])
    return {"message": f"Started {instance_name}"}


@app.post("/api/instances/{instance_name}/stop")
async def stop_instance(instance_name: str):
    session = f"mcc-{instance_name}"
    subprocess.run(["tmux", "kill-session", "-t", session])
    return {"message": f"Stopped {instance_name}"}


@app.get("/api/console/{instance_name}")
async def get_console(instance_name: str):
    session = f"mcc-{instance_name}"
    check = await check_instance_status(instance_name)
    if check != "active":
        return {"lines": ["Instance is completely offline."]}

    log_check = subprocess.run(
        ["tmux", "capture-pane", "-t", session, "-p", "-S", "-30"],
        capture_output=True,
        text=True,
    )
    return {"lines": log_check.stdout.splitlines()}


if __name__ == "__main__":
    import uvicorn

    # Bound strictly to localhost so the public internet cannot hit the API directly
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
