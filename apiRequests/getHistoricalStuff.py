import blpapi
import random
from optparse import OptionParser

stockList = ["IBM US Equity","MSFT US Equity","TSLA US Equity"]
stockFieldList = ["PX_LAST","PX_MID","OPEN","PX_LOW","PX_HIGH"]
dataCapPerRequest = 10000
serverIP = '10.8.8.1'
port = 8194



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

#Default method
def main():
    makeRandomHistoricalRequest("20120101", "20121231", "MONTHLY")

def getStockList():
    return stockList

def getStockFieldList():
    return stockFieldList

def makeRandomHistoricalRequest(startDate, finishDate, frequency):
    stock = stockList[random.randrange(0,len(stockList))]
    field = stockFieldList[random.randrange(0,len(stockFieldList))]
    return makeHistoricalRequest(stock,field, startDate, finishDate, frequency)
#Use to make request
def makeHistoricalRequest(name, price, startDate, finishDate, frequency):

    # Fill SessionOptions
    sessionOptions = blpapi.SessionOptions()
    sessionOptions.setServerHost(serverIP)
    sessionOptions.setServerPort(port)

    #print "Connecting to %s:%s" % (serverIP, port)
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
        request = requestBuilder(name, price, startDate, finishDate, frequency, session)

        #print "Sending Request:", request
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
                    #print msg
                    fieldDataArr = msg.getElement("securityData").getElement("fieldData")
                    for fieldData in fieldDataArr.values():
                        data = fieldData.getElement(price)
                        splitElement = data.toString().split()
                        valueList.append(float(splitElement.pop()))

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
    #print "SimpleHistoryExample"
    try:
        main()
    except KeyboardInterrupt:
        print "Ctrl+C pressed. Stopping..."




#---UNUSED CODE---
#DELETE DURING REFACTORING

#options = parseCmdLine()

#def parseCmdLine():
#    parser = OptionParser(description="Retrieve reference data.")
#    parser.add_option("-a",
#                      "--ip",
#                      dest="host",
#                      help="server name or IP (default: %default)",
#                      metavar="ipAddress",
#                      default="localhost")
#    parser.add_option("-p",
#                      dest="port",
#                      type="int",
#                      help="server port (default: %default)",
#                      metavar="tcpPort",
#                      default=8194)
#
#    (options, args) = parser.parse_args()
#
#    return options

# def printField(field):
#     fldId = field.getElementAsString(FIELD_ID)
#     if field.hasElement(FIELD_INFO):
#         fldInfo = field.getElement(FIELD_INFO)
#         fldMnemonic = fldInfo.getElementAsString(FIELD_MNEMONIC)
#         fldDesc = fldInfo.getElementAsString(FIELD_DESC)

#         print "%s%s%s" % (fldId.ljust(ID_LEN), fldMnemonic.ljust(MNEMONIC_LEN),
#                           fldDesc.ljust(DESC_LEN))
#     else:
#         fldError = field.getElement(FIELD_ERROR)
#         errorMsg = fldError.getElementAsString(FIELD_MSG)

#         print
#         print " ERROR: %s - %s" % (fldId, errorMsg)