using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace LittleWeebIRC
{
    class dlData
    {
        public string dlId { get; set; }
        public string dlBot { get; set; }
        public string dlPack { get; set; }

        public dlData()
        {
            //nadanoppes
        }

        public dlData(string dlId, string dlBot, string dlPack)
        {
            this.dlBot = dlBot;
            this.dlId = dlId;
            this.dlPack = dlPack;
        }
    }
}
