import * as assert from "assert";
import { PythonParser } from "../languages/python/pythonParser";

suite("Python Parser", () => {
    const parser = new PythonParser();

    test("supports Python files case-insensitively", () => {
        assert.strictEqual(parser.supports("app.py"), true);
        assert.strictEqual(parser.supports("APP.PY"), true);
        assert.strictEqual(parser.supports("app.ts"), false);
    });

    test("discovers FastAPI and Flask-style routes", () => {
        const contracts = parser.parse(
            `
@app.get("/users")
def get_users():
    return {"users": []}

@router.post("/users")
def create_user():
    return {"id": 1}

@app.delete("/users/{user_id}")
def delete_user(user_id: int):
    return {"success": True}
`,
            "app.py"
        );

        assert.strictEqual(contracts.length, 3);

        assert.deepStrictEqual(
            contracts.map(contract => ({
                method: contract.method,
                path: contract.path
            })),
            [
                { method: "GET", path: "/users" },
                { method: "POST", path: "/users" },
                { method: "DELETE", path: "/users/{user_id}" }
            ]
        );

        assert.ok(
            contracts.every(contract => contract.file === "app.py")
        );
    });
    test("extracts primitive response fields", () => {
    const contracts = parser.parse(
        `
@app.get("/users")
def get_users():
    return {
        "id": 1,
        "name": "Komal",
        "active": True,
        "deleted_at": None
    }
`,
        "app.py"
    );

    assert.strictEqual(contracts.length, 1);

    assert.deepStrictEqual(
        contracts[0].response?.fields,
        [
            { name: "id", type: "number" },
            { name: "name", type: "string" },
            { name: "active", type: "boolean" },
            { name: "deleted_at", type: "null" }
        ]
    );
});
test("discovers Flask routes and their HTTP methods", () => {
    const contracts = parser.parse(`
@app.route("/health")
def health():
    return {"status": "ok"}

@app.route("/users", methods=["POST"])
def create_user():
    return {"id": 1}

@app.route("/users/<int:user_id>", methods=["GET", "DELETE"])
def user_detail(user_id):
    return {"id": user_id}
`, "app.py");

    assert.deepStrictEqual(
        contracts.map(({ method, path }) => ({ method, path })),
        [
            { method: "GET", path: "/health" },
            { method: "POST", path: "/users" },
            { method: "GET", path: "/users/<int:user_id>" },
            { method: "DELETE", path: "/users/<int:user_id>" }
        ]
    );
});
});