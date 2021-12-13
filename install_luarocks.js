const exec = require("@actions/exec");
const tc = require("@actions/tool-cache");
const io = require("@actions/io");
const path = require("path");

async function exportPath(core, executable) {
  let PATH = "";
  await exec.exec(executable, ["path", "--lr-bin"], {
    listeners: {
      stdout: (data) => {
        PATH += data.toString();
      },
    },
  });
  if (PATH != "") {
    core.addPath(PATH.trim());
  }

  let LUA_PATH = "";
  await exec.exec(executable, ["path", "--lr-path"], {
    listeners: {
      stdout: (data) => {
        LUA_PATH += data.toString();
      },
    },
  });
  if (LUA_PATH != "") {
    core.exportVariable("LUA_PATH", LUA_PATH.trim());
  }

  let LUA_CPATH = "";
  await exec.exec(executable, ["path", "--lr-cpath"], {
    listeners: {
      stdout: (data) => {
        LUA_CPATH += data.toString();
      },
    },
  });
  if (LUA_CPATH != "") {
    core.exportVariable("LUA_CPATH", LUA_CPATH.trim());
  }
}

async function installLua(core) {
  const dlib = "lua51.dll";
  const version = "2.1.0-beta3";
  const installPath = path.join(process.env.USERPROFILE, ".local");
  const targetPath = path.join(installPath, `LuaJIT-${version}`);
  const tar = await tc.downloadTool(
    `https://luajit.org/download/LuaJIT-${version}.tar.gz`
  );
  await io.mkdirP(targetPath);
  await tc.extractTar(tar, installPath);

  await exec.exec("make", [], {
    cwd: targetPath,
  });

  const exe = "luajit.exe";

  const src = path.join(targetPath, "src");
  const bin = path.join(targetPath, "bin");
  await io.mkdirP(bin);
  await io.cp(path.join(src, exe), path.join(bin, exe));
  await io.cp(path.join(src, dlib), path.join(bin, dlib));

  const lib = path.join(targetPath, "lib");
  await io.mkdirP(lib);
  await io.cp(path.join(src, dlib), path.join(lib, dlib));

  const include = path.join(targetPath, "include");
  await io.mv(src, include);

  core.addPath(bin);

  return {
    bin: bin,
    executable: path.join(bin, exe),
    lib: lib,
    root: targetPath,
  };
}

async function install(core, _, luajit) {
  const installPath = path.join(process.env.USERPROFILE, ".local");
  const dirName = `luarocks-luarocks-97e1801`;
  const targetPath = path.join(installPath, dirName);
  const zip = await tc.downloadTool(
    `https://api.github.com/repos/luarocks/luarocks/zipball/fix-deploy-on-non-wrapped-scripts`
  );
  await io.mkdirP(targetPath);
  await tc.extractZip(zip, installPath);

  const luarocksPath = path.join(luajit.root, "luarocks");
  await exec.exec(
    "./install.bat",
    [
      "/F",
      "/MW",
      "/LUA",
      luajit.root,
      "/LIB",
      luajit.bin,
      "/P",
      luarocksPath,
      "/NOADMIN",
      "/SELFCONTAINED",
      "/Q",
    ],
    {
      cwd: targetPath,
    }
  );

  const bin = luarocksPath;
  core.addPath(bin);

  const executable = path.join(bin, "luarocks.bat");
  await exportPath(core, executable);

  const module_bin = path.join(bin, "systree/bin");
  core.addPath(module_bin);

  return { bin: bin, executable: executable };
}

module.exports = async (core) => {
  const { LUAROCKS_VERSION } = process.env;
  const luajit = await installLua(core);
  const luarocks = await install(core, LUAROCKS_VERSION, luajit);
  core.setOutput("luajit", luajit.executable);
  core.setOutput("luarocks", luarocks.executable);
};
