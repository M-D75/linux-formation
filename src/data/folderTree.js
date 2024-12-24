export const folderTree = {
  name: 'root',
  type: "d",
  rights: "drwxr-xr-x",
  user: "root",
  group: "root",
  date: "24-11-23 14:00",
  children: [
    {
      name: 'home',
      type: "d",
      rights: "drwxr-xr-x",
      user: "root",
      group: "root",
      date: "24-11-23 14:00",
      children: [
        {
          name: 'user',
          type: "d",
          rights: "drwxr-xr-x",
          user: "user",
          group: "user",
          date: "24-11-23 13:50",
          children: [
            { name: 'documents', type: "d", rights: "drwxr-xr-x", user: "user", group: "user", date: "24-11-20 10:30", children: [] },
            { name: 'pictures', type: "d", rights: "drwxr-xr-x", user: "user", group: "user", date: "24-11-21 11:45", children: [] },
            { name: '.ssh', type: "d", rights: "drwxr-xr-x", hidden: true, user: "user", group: "user", date: "24-11-21 11:45", children: [] },
          ],
        },
      ],
    },
    {
      name: 'var',
      type: "d",
      rights: "drwxr-xr-x",
      user: "root",
      group: "root",
      date: "24-11-23 13:40",
      children: [
        { name: 'log', type: "d", rights: "drwxr-xr-x", user: "root", group: "root", date: "24-11-22 12:00", children: [] },
        { name: 'tmp', type: "d", rights: "drwxrwxrwx", user: "root", group: "root", date: "24-11-23 12:30", children: [] },
      ],
    },
    {
      name: 'etc',
      type: "d",
      rights: "drwxr-xr-x",
      user: "root",
      group: "root",
      date: "24-11-23 13:30",
      children: [
        {
          name: 'nginx',
          type: "d",
          rights: "drwxr-xr-x",
          user: "root",
          group: "root",
          date: "24-11-20 10:30",
          children: [
            {
              name: 'nginx.conf',
              type: "f",
              rights: "-rw-r--r--",
              user: "root",
              group: "root",
              date: "24-11-18 09:15",
            },
          ],
        },
      ],
    },
  ],
};
