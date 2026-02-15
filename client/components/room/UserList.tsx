"use client";

interface User {
  username: string;
}

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  return (
    <div className="h-full flex flex-col">
      <h3 className="text-xl font-bold text-center text-gray-800 mb-4">
        Participants ({users.length})
      </h3>
      <ul className="space-y-3 flex-grow overflow-y-auto">
        {users.map((user, index) => (
          <li
            key={index}
            className="flex items-center p-3 bg-gray-50 rounded-lg"
          >
            <span className="text-lg mr-3">👤</span>
            <span className="text-gray-700 font-medium">{user.username}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
