const users = [];

export async function listUsers() {
  return users;
}

export async function createUser(payload) {
  const { id: _ignored, ...publicFields } = payload;
  const user = { id: `usr_${Date.now()}`, ...publicFields };
  users.push(user);
  return user;
}
