export default class CookieManagement {
  private path = "/";

  setCookie(name: string, value: string, exMinutes: number) {
    const d = new Date();
    d.setTime(d.getTime() + (exMinutes / (24 * 60)) * 24 * 60 * 60 * 1000);
    const expires = "expires=" + d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + `;path=${this.path}`;
  }

  getCookie(cname: string): string | null {
    const name = cname + "=";
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c?.charAt(0) == " ") {
        c = c.substring(1);
      }
      if (c?.indexOf(name) == 0) {
        return c?.substring(name.length, c?.length);
      }
    }
    return null;
  }

  setPath(path: string) {
    this.path = path;
  }
}
