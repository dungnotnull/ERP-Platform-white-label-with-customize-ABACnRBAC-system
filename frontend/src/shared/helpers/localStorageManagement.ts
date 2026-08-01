export default class LocalStorageManagement {
  setItem(name: string, value: string) {
    localStorage.setItem(name, value);
  }

  getItem(name: string) {
    return localStorage.getItem(name);
  }
}
