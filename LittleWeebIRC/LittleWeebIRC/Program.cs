using SimpleIRCLib;
using SimpleWebSocketServer;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.IO;
using System.Diagnostics;
using System.Windows.Forms;
using System.Net;
using System.Net.Sockets;
using Microsoft.WindowsAPICodePack.Dialogs;
using System.Runtime.Serialization;
using System.Runtime.Serialization.Formatters.Binary;

namespace LittleWeebIRC
{
    class Program
    {

        public static SimpleIRC irc;
        public static List<dlData> downloadList;
        public static bool currentlyDownloading = false;
        public static string currentDownloadId = "";
        public static WebSocketServer server;
        public static string currentDownloadLocation = "";
        public static bool closeBackend = false;
        public static bool joinedChannel = false;
        public static string settingsLocation = "";

        static void Main(string[] args)
        {

            string folder = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);

            // Combine the base folder with your specific folder....
            settingsLocation = Path.Combine(folder, "LittleWeeb");

            if (!Directory.Exists(settingsLocation))
            {
                Directory.CreateDirectory(settingsLocation);
            }

            currentDownloadLocation = AppDomain.CurrentDomain.BaseDirectory;

            loadSettings();
            

            downloadList = new List<dlData>();

            server = new WebSocketServer(600);
            server.MessageReceived += new EventHandler<WebSocketEventArgs>(WsMessageReceived);
            server.DebugMessage += new EventHandler<WebSocketEventArgs>(WsDebugReceived);
            server.Start();
            server.SendGlobalMessage("HELLO LITTLE WEEB");

              
            string webgui = AppDomain.CurrentDomain.BaseDirectory + @"GUI\index.html#socketip=" + GetLocalIPAddress();
            try
            {
                Process.Start("chrome.exe", " --app=\"" + webgui + "\"");
            } catch
            {
                Process.Start(webgui);
                Console.WriteLine("Could not start webgui :*(");
            }


            string generatedUsername = RandomString(6);
            StartIRC("irc.rizon.net", 6667, generatedUsername, "#nibl");


            Thread dlListChecker = new Thread(new ThreadStart(downloaderLogic));
            dlListChecker.Start();

            while (!closeBackend)  //irc output and such are handled in different threads
            {
                Thread.Sleep(10);
            }

            try
            {
                irc.stopXDCCDownload();
                irc.stopClient();
            }
            catch { }

            try
            {
                dlListChecker.Abort();
            }
            catch { }

            Environment.Exit(0);
        }

        public static void WsMessageReceived(object sender, WebSocketEventArgs args)
        {
            string msg = args.Message;
            Console.WriteLine(msg);
            if (msg.Contains("AreWeJoined"))
            {
                if (joinedChannel)
                {
                    server.SendGlobalMessage("IrcConnected");
                }
            }
            if (msg.Contains("AddToDownloads"))
            {
                string[] data = msg.Split(':');
                string dlId = data[1];
                string dlPack = data[2];
                string dlBot = data[3];
                Console.WriteLine("ADDING TO DOWLOADS: " + dlId + " /msg " + dlBot + " xdcc send #" + dlPack);
                dlData d = new dlData();
                d.dlId = dlId;
                d.dlBot = dlBot;
                d.dlPack = dlPack;
                downloadList.Add(d);
            }
            if (msg.Contains("AbortDownload"))
            {
                try
                {
                    irc.stopXDCCDownload();
                }
                catch
                {
                    Console.WriteLine("tried to stop download but there isn't anything downloading or no connection to irc");
                }
            }
            if (msg.Contains("DeleteDownload"))
            {
                string dlId = msg.Split(':')[1];
                string fileName = msg.Split(':')[2];
                if (currentDownloadId == dlId)
                {
                    try
                    {
                        irc.stopXDCCDownload();
                    }
                    catch
                    {
                        Console.WriteLine("tried to stop download but there isn't anything downloading or no connection to irc");
                    }
                }
                else
                {
                    int index = 0;
                    foreach (dlData data in downloadList)
                    {
                        if (data.dlId == dlId)
                        {
                            downloadList.Remove(data);
                            break;
                        }
                        index++;
                    }

                    try
                    {
                        File.Delete(currentDownloadLocation + "\\" + fileName); 
                    } catch (IOException e)
                    {
                        Console.WriteLine("We've got a problem :( -> " + e.ToString());
                    }
                }
            }
            if (msg.Contains("OpenDirectory"))
            {

                Process.Start(currentDownloadLocation);
            }
            if (msg.Contains("OpenFileDialog"))
            {
                Console.WriteLine("OPENING FILE D DIALOG");
                Thread openfdwithoutblocking = new Thread(new ThreadStart(delegate
                {

                    Thread openfd = new Thread(new ThreadStart(setDlDir));
                    openfd.TrySetApartmentState(ApartmentState.STA);
                    openfd.Start();
                    openfd.Join();
                }));
                openfdwithoutblocking.Start();
            }
            if (msg.Contains("PlayFile"))
            {
                string dlId = msg.Split(':')[1];
                string fileName = msg.Split(':')[2].Trim();
                string fileLocation = Path.Combine(currentDownloadLocation, fileName); 
                try
                {
                    Console.WriteLine("Trying to open file: " + fileLocation);
                    Thread player = new Thread(new ThreadStart(delegate
                    {
                        Process.Start(fileLocation);
                    }));
                    player.Start();
                }
                catch(Exception e)
                {
                    Console.WriteLine("We've got another problem: " + e.ToString());
                }
            }

            if (msg.Contains("GetCurrentDir"))
            {
                server.SendGlobalMessage("CurrentDir^" + currentDownloadLocation);
            }

            if (msg.Contains("CLOSE"))
            {
                Console.WriteLine("CLOSING SHIT");
                closeBackend = true;
            }
        }

        public static void WsDebugReceived(object sender, WebSocketEventArgs args)
        {
            string msg = args.Message;
            Console.WriteLine("WSDEBUG: " + msg);
        }
        
        public static void setDlDir()
        {
            Console.WriteLine("TRYING TO OPEN FD");

            using(var fbd = new CommonOpenFileDialog())
            {
                fbd.InitialDirectory = "C:\\Users";
                fbd.IsFolderPicker = true;

                if (fbd.ShowDialog() == CommonFileDialogResult.Ok && !string.IsNullOrWhiteSpace(fbd.FileName))
                {
                    currentDownloadLocation = fbd.FileName;
                    irc.setCustomDownloadDir(currentDownloadLocation);
                    server.SendGlobalMessage("CurrentDir^" + currentDownloadLocation);
                    saveSettings();
                }

            }
        }

        public static void downloaderLogic()
        {
            while (!closeBackend)
            {
                if (!currentlyDownloading)
                {
                    if(downloadList.Count > 0)
                    {
                        dlData data = downloadList[0];
                        currentDownloadId = data.dlId;
                        bool succes = false;
                        try
                        {
                           
                            succes = true;
                            irc.sendMessage("/msg " + data.dlBot + " xdcc send #" + data.dlPack);
                            Thread.Sleep(1000);
                        }
                        catch
                        {
                            currentlyDownloading = false;
                            Console.WriteLine("NOT CONNECTED TO IRC, CAN'T DOWNLOAD FILE :(");
                        }

                        if (succes)
                        {

                            currentlyDownloading = true;
                            downloadList.Remove(data);
                            server.SendGlobalMessage("DOWNLOADSTARTED");
                        }
                    }
                }
                Thread.Sleep(500);
            }
        }


        public static void StartIRC(string ip, int port, string username, string channel)
        {
            try
            {
                if (irc.isClientRunning())
                {
                    irc.stopClient();
                }
            } catch
            {

            }
            irc = new SimpleIRC();
            irc.setupIrc(ip, port, username, "", channel, chatOutputCallback);
            irc.setDebugCallback(debugOutputCallback);
            irc.setDownloadStatusChangeCallback(downloadStatusCallback);
            irc.setUserListReceivedCallback(userListReceivedCallback);
            irc.setCustomDownloadDir(currentDownloadLocation);
            irc.startClient();

            int x = 3;
            while (x > 0)
            {
                Thread.Sleep(1000);
                x--;
            }

            if (!joinedChannel)
            {
                Console.WriteLine("DID NOT JOIN CHANNEL, RETRY!");
                StartIRC(ip, port, username, channel);
            }


            server.SendGlobalMessage("IrcConnected-CurrentDir^" + currentDownloadLocation);

            // irc.sendMessage("/join #nibl");
        }

        public static void chatOutputCallback(string user, string message)
        {
            Console.WriteLine(user + ":" + message);
        }

        public static void debugOutputCallback(string debug)
        {
            Console.WriteLine("===============DEBUG MESSAGE===============");
            Console.WriteLine(debug);
            Console.WriteLine("===============END DEBUG MESSAGE===============");

        }

        public static void downloadStatusCallback() //see below for definition of each index in this array
        {
            Object progress = irc.getDownloadProgress("progress");
            Object speedkbps = irc.getDownloadProgress("kbps");
            Object status = irc.getDownloadProgress("status");
            Object filename = irc.getDownloadProgress("filename");

            if (status.ToString().Contains("DOWNLOADING") && status.ToString().Contains("WAITING"))
            {
                currentlyDownloading = true;
            }
            else if (status.ToString().Contains("FAILED") || status.ToString().Contains("COMPLETED") || status.ToString().Contains("ABORTED"))
            {
                currentlyDownloading = false;
            }

            server.SendGlobalMessage("DOWNLOADUPDATE:" + currentDownloadId + ":" + progress.ToString() + ":" + speedkbps.ToString() + ":" + status.ToString() + ":" + filename.ToString());
        }

        public static void userListReceivedCallback(string[] users) //see below for definition of each index in this array
        {
            joinedChannel = true;
            foreach (string user in users)
            {
                Console.WriteLine(user);
            }
        }

        public static void saveSettings()
        {
            Settings setting = new Settings();
            setting.downloaddir = currentDownloadLocation;
            IFormatter formatter = new BinaryFormatter();
            string settingsFile = Path.Combine(settingsLocation, "LittleWeebSettings.bin");
            Stream stream = new FileStream(settingsFile, FileMode.Create, FileAccess.Write, FileShare.None);
            formatter.Serialize(stream, setting);
            stream.Close();
        }

        public static void loadSettings()
        {
            IFormatter formatter = new BinaryFormatter();

            string settingsFile = Path.Combine(settingsLocation, "LittleWeebSettings.bin");
            if (!File.Exists(settingsFile))
            {
                File.Create(settingsFile);
            } else
            {

                Stream stream = new FileStream(settingsFile, FileMode.Open, FileAccess.Read, FileShare.Read);
                Settings setting = (Settings)formatter.Deserialize(stream);
                stream.Close();
                currentDownloadLocation = setting.downloaddir;
            }
        }
        

        private static Random random = new Random();
        public static string RandomString(int length)
        {
            const string chars = "abcdefghijklmnopqrstuvwxyz";
            return new string(Enumerable.Repeat(chars, length)
              .Select(s => s[random.Next(s.Length)]).ToArray());
        }

        public static string GetLocalIPAddress()
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
