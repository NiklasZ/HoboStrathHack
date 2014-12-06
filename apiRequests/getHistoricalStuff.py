import blpapi
from optparse import OptionParser

randomIndexAndStockList = ["IBM US Equity","MSFT US Equity","TSLA US Equity"]
fieldList = ["PX_LAST","PX_MID","OPEN","PX_LOW","PX_HIGH"]
dataCapPerRequest = 10000


def parseCmdLine():
    parser = OptionParser(description="Retrieve reference data.")
    parser.add_option("-a",
                      "--ip",
                      dest="host",
                      help="server name or IP (default: %default)",
                      metavar="ipAddress",
                      default="localhost")
    parser.add_option("-p",
                      dest="port",
                      type="int",
                      help="server port (default: %default)",
                      metavar="tcpPort",
                      default=8194)

    (options, args) = parser.parse_args()

    return options

def requestBuilder(name, price, startDate, finishDate, frequency, session):

    refDataService = session.getService("//blp/refdata")
    request = refDataService.createRequest("HistoricalDataRequest")
    request.getElement("securities").appendValue(name)
    request.getElement("fields").appendValue(price)

    request.set("periodicityAdjustment", "ACTUAL")
    request.set("periodicitySelection",frequency)
    request.set("startDate", startDate)
    request.set("endDate", finishDate)
    request.set("maxDataPoints", dataCapPerRequest)

    return request

def main():
    makeRequest()

def makeRequest():
    options = parseCmdLine()
    # Fill SessionOptions
    sessionOptions = blpapi.SessionOptions()
    sessionOptions.setServerHost(options.host)
    #Manual override of serverPort
    #sessionOptions.setServerHost("10.8.1.1")
    sessionOptions.setServerPort(options.port)

    print "Connecting to %s:%s" % (options.host, options.port)
    # Create a Session
    session = blpapi.Session(sessionOptions)

    # Start a Session
    if not session.start():
        print "Failed to start session."
        return

    try:
        # Open service to get historical data from
        if not session.openService("//blp/refdata"):
            print "Failed to open //blp/refdata"
            return

        # Obtain previously opened service
        request = requestBuilder("IBM US Equity", "PX_MID", "20120101", "20121231", "MONTHLY", session)

        print "Sending Request:", request
        # Send the request
        session.sendRequest(request)
        # Process received events
        counter = 0
        valueList = []
        while(True):
            # We provide timeout to give the chance for Ctrl+C handling:
            ev = session.nextEvent(500)
            if counter > 2:
                for msg in ev:
                    print msg
                    fieldDataArr = msg.getElement("securityData").getElement("fieldData")#.HistoricalDataResponse.securityData.fieldData[0].fieldData.date
                    #print fieldDataArr
                    #print fieldDataArr.elements()
                    #fieldData = fieldDataArr.values()
                    #while (fieldData = fieldDataArr.values().next()) != None
                    #for fieldData in fieldDataArr.elements():
                    for fieldData in fieldDataArr.values():
                        data = fieldData.getElement("PX_MID")
                        #print data.getValueAsFloat64(0)
                        #print fieldData.getElement("PX_MID")
                        #print data.toString()
                        splitElement = data.toString().split()
                        #print splitElement
                        #print splitElement[len(splitElement)]
                        #print 
                        valueList.append(splitElement.pop())
                        #valueList.append(splitElement.pop())

            if ev.eventType() == blpapi.Event.RESPONSE:
                # Response completly received, so we could exit
                break

            counter = counter + 1
    finally:
        # Stop the session
        session.stop()
        print valueList
    return valueList

if __name__ == "__main__":
    print "SimpleHistoryExample"
    try:
        main()
    except KeyboardInterrupt:
        print "Ctrl+C pressed. Stopping..."



def printField(field):
    fldId = field.getElementAsString(FIELD_ID)
    if field.hasElement(FIELD_INFO):
        fldInfo = field.getElement(FIELD_INFO)
        fldMnemonic = fldInfo.getElementAsString(FIELD_MNEMONIC)
        fldDesc = fldInfo.getElementAsString(FIELD_DESC)

        print "%s%s%s" % (fldId.ljust(ID_LEN), fldMnemonic.ljust(MNEMONIC_LEN),
                          fldDesc.ljust(DESC_LEN))
    else:
        fldError = field.getElement(FIELD_ERROR)
        errorMsg = fldError.getElementAsString(FIELD_MSG)

        print
        print " ERROR: %s - %s" % (fldId, errorMsg)