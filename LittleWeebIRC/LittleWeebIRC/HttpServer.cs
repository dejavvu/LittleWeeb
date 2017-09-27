using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;

namespace LittleWeebIRC
{
    class HttpServer
    {

        public Action<string> MessageReceivedCallback = null;
        public string jsonDataToSend = "\"NOMESSAGES\",";
        public string rawJsonToSend = "[\"NOMESSAGES\"]";
        public string homeDir = Directory.GetCurrentDirectory();
        public string fileDir = Directory.GetCurrentDirectory();
        public string defaultPage = "index.html";
        public Thread runServer;
        public static bool disconnect = false;

        public HttpServer()
        {
            this.MessageReceivedCallback = null;
            disconnect = false;
            runServer = new Thread(new ThreadStart(() => ServerLogic(8080)));
        }

        public HttpServer(int port)
        {
            this.MessageReceivedCallback = null;
            disconnect = false;
            runServer = new Thread(new ThreadStart(() => ServerLogic(port)));
        }

        public HttpServer(Action<string> MessageReceivedCallback)
        {
            this.MessageReceivedCallback = MessageReceivedCallback;
            disconnect = false;
            runServer = new Thread(new ThreadStart(() => ServerLogic(8080)));
        }

        public HttpServer(Action<string> MessageReceivedCallback, int port)
        {
            this.MessageReceivedCallback = MessageReceivedCallback;
            disconnect = false;
            runServer = new Thread(new ThreadStart(() => ServerLogic(port)));
        }

        public void Start()
        {
            runServer.Start();
        }

        public void StopServer()
        {
            disconnect = false;
        }

        public void SetWebHomeDir(string dir)
        {
            homeDir = dir;
        }

        public void SetFileDir(string dir)
        {
            fileDir = dir;
        }

        public void SetDefaultPage(string fileName)
        {
            defaultPage = fileName;
        }

        public void SendMessage(string msg)
        {
            //jsonDataToSend = jsonDataToSend + "\"" + msg + "\",";
            jsonDataToSend = "\"" + msg + "\"";
        }

        public void JsonToSend(string json)
        {
            rawJsonToSend = json;
        }

        public void ServerLogic(int port)
        {

            TcpListener listener = new TcpListener( new IPEndPoint(IPAddress.Any, port));
            listener.Start();

            while (true)
            {
                TcpClient client = listener.AcceptTcpClient();
                Console.WriteLine("Accepted client at: " + client.Client.LocalEndPoint.ToString());
                var childSocketThread = new Thread(() => WriteFile(client));
                childSocketThread.Start();
            }
        }

        public void WriteFile(TcpClient client)
        {
            NetworkStream strm = client.GetStream();
            byte[] incommingBuffer = new byte[1024];
            
            while (client.Connected)
            {
                if (strm.DataAvailable)
                {
                    strm.Read(incommingBuffer, 0, incommingBuffer.Length);
                    string dataRead = Encoding.ASCII.GetString(incommingBuffer);
                    Console.WriteLine(dataRead);
                    if (dataRead.Contains("GET"))
                    {
                        string fileName = Uri.UnescapeDataString(dataRead.Split(new string[] { "GET" }, StringSplitOptions.None)[1].Split(new string[] { "HTTP" }, StringSplitOptions.None)[0].Trim());
                        Console.WriteLine("FILE REQ: " + fileDir + fileName);
                        StringBuilder response = new StringBuilder();

                        if (dataRead.Contains("whatsyourip"))
                        {
                            byte[] buffer = Encoding.ASCII.GetBytes(GetLocalIPAddress());
                            response.Append("HTTP/1.1 200 OK \r\n");
                            response.Append("Access-Control-Allow-Origin: * \r\n");
                            response.Append("Content-Length: " + buffer.Length + " \r\n");
                            response.Append("Content-Type: text/plain\r\n\r\n");
                            byte[] header = Encoding.ASCII.GetBytes(response.ToString());
                            strm.Write(header, 0, header.Length);
                            strm.Write(buffer, 0, buffer.Length);
                            strm.Flush();
                            strm.Close();
                        } else
                        {


                            if (IsMediaFile(fileName))
                            {
                                Console.WriteLine("Is mediafile");
                                try
                                {

                                    using (FileStream fs = File.OpenRead(fileDir + fileName))
                                    {

                                        string filename = Path.GetFileName(fileDir + fileName);
                                        //response is HttpListenerContext.Response...
                                        response.Append("HTTP/1.1 200 OK \r\n");
                                        response.Append("Content-Length: " + fs.Length + " \r\n");
                                        response.Append("Access-Control-Allow-Origin: * \r\n");
                                        response.Append("Content-Type: application/octet-stream \r\n\r\n");
                                        //response.Append("Content-Disposition: attachment; filename=" + filename + " \r\n\r\n");
                                        byte[] header = Encoding.ASCII.GetBytes(response.ToString());

                                        strm.Write(header, 0, header.Length);

                                        byte[] buffer = new byte[64 * 1024];
                                        int read;
                                        using (BinaryWriter bw = new BinaryWriter(strm))
                                        {
                                            while ((read = fs.Read(buffer, 0, buffer.Length)) > 0)
                                            {
                                                try
                                                {
                                                    bw.Write(buffer, 0, read);
                                                    bw.Flush(); //seems to have no effect

                                                }
                                                catch
                                                {
                                                    break;
                                                }
                                            }

                                            bw.Close();
                                        }
                                        strm.Close();
                                    }

                                }
                                catch (Exception e)
                                {
                                    response.Append("HTTP/1.1 404 Not Found \r\n");
                                    Console.WriteLine("Failed to write file to stream: " + e.ToString());
                                    byte[] header = Encoding.ASCII.GetBytes(response.ToString());
                                    strm.Write(header, 0, header.Length);
                                    strm.Flush();
                                    strm.Close();
                                }
                            }
                            else
                            {


                                if (fileName == "/" || fileName.Length < 2)
                                {
                                    if (!IsLinux)
                                    {
                                        fileName = homeDir + @"\" + defaultPage;
                                    }
                                    else
                                    {
                                        fileName = homeDir + @"\" + defaultPage;
                                    }
                                }
                                string mimeType = "text/html";
                                if (IsFontFile(fileName))
                                {
                                    mimeType = "font/opentype";
                                }
                                if (IsWebPageFile(fileName))
                                {
                                    mimeType = "text/html";
                                }
                                if (IsSubtitleFile(fileName))
                                {
                                    mimeType = "text/plain";
                                }
                                if (IsStylingFile(fileName))
                                {
                                    mimeType = "text/css";
                                }

                                if (IsMediaFile(fileName))
                                {
                                    mimeType = "application/octet-stream";
                                }

                                if (IsImageFile(fileName))
                                {
                                    mimeType = "image/svg+xml";
                                }



                                if (!fileName.Contains(homeDir))
                                {
                                    fileName = homeDir + fileName;
                                    if (IsLinux)
                                    {
                                        fileName = fileName.Replace(@"\", "/");
                                    }
                                    else
                                    {
                                        fileName = fileName.Replace("/", @"\");
                                    }
                                }
                                else
                                {
                                    if (IsLinux)
                                    {
                                        fileName = Path.Combine(homeDir, fileName.Replace(@"\", "/"));
                                    }
                                    else
                                    {
                                        fileName = Path.Combine(homeDir, fileName.Replace("/", @"\"));
                                    }
                                }




                                try
                                {
                                    byte[] buffer = File.ReadAllBytes(fileName);

                                    response.Append("HTTP/1.1 200 OK \r\n");
                                    response.Append("Content-Length: " + buffer.Length + " \r\n");
                                    response.Append("Content-Type: " + mimeType + " \r\n\r\n");

                                    byte[] header = Encoding.ASCII.GetBytes(response.ToString());
                                    strm.Write(header, 0, header.Length);
                                    strm.Write(buffer, 0, buffer.Length);
                                    strm.Flush();
                                    strm.Close();
                                }
                                catch
                                {
                                    response.Append("HTTP/1.1 404 Not Found \r\n");

                                    byte[] header = Encoding.ASCII.GetBytes(response.ToString());
                                    strm.Write(header, 0, header.Length);
                                    strm.Flush();
                                    strm.Close();
                                }

                            }

                        }
                    }
                }
                Thread.Sleep(1);
            }    
        }

        public bool IsStylingFile(string filename)
        {
            string[] fileExtensions = new string[] { ".css" };
            string extension = Path.GetExtension(filename);

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public bool IsWebPageFile(string filename)
        {
            string[] fileExtensions = new string[] { ".html", ".htm", ".js" };
            string extension = Path.GetExtension(filename);
            //Console.WriteLine("File Extension: " + extension);

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                //Console.WriteLine("FILE IS HTML FILE");
                return true;
            }
            else
            {
                return false;
            }
        }

        public bool IsSubtitleFile(string filename)
        {
            string[] fileExtensions = new string[] { ".ass", ".vtt", ".srt" };
            string extension = Path.GetExtension(filename);
            Console.WriteLine("SubFile Extension: " + extension);

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                Console.WriteLine("FILE IS SUB FILE");
                return true;
            }
            else
            {
                Console.WriteLine("FILE IS NOT SUB FILE");
                return false;
            }
        }

        public bool IsFontFile(string filename)
        {
            string[] fileExtensions = new string[] { ".woff", ".woff2", ".eot", ".tff" };
            string extension = Path.GetExtension(filename);

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public bool IsMediaFile(string filename)
        {
            string[] fileExtensions = new string[] { ".mkv", ".mp4", ".avi", ".flak", ".mp3", ".aac", ".exe", ".tar", ".aaf", ".3gp", ".asf", ".avchd", ".avi", ".bik", ".dat", ".flv", ".mpeg", ".m4v", ".mkv", ".mp4", ".mts", ".wmv", ".vp9", ".vp8", ".webm" };
            string extension = Path.GetExtension(filename.ToLower());

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public bool IsImageFile(string filename)
        {
            string[] fileExtensions = new string[] { ".jpg", ".png", ".gif", ".svg", ".bmp" };
            string extension = Path.GetExtension(filename);

            int inArray = Array.IndexOf(fileExtensions, extension);
            if (inArray > -1)
            {
                return true;
            }
            else
            {
                return false;
            }
        }

        public bool IsLinux
        {
            get
            {
                int p = (int)Environment.OSVersion.Platform;
                return (p == 4) || (p == 6) || (p == 128);
            }
        }

        public string GetLocalIPAddress()
        {
            var host = Dns.GetHostEntry(Dns.GetHostName());
            foreach (var ip in host.AddressList)
            {
                if (ip.AddressFamily == AddressFamily.InterNetwork)
                {
                    return ip.ToString();
                }
            }
            throw new Exception("Local IP Address Not Found!");
        }
    }
}
