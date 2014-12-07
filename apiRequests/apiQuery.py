import blpapi
import random
import csv
from optparse import OptionParser

#Global vars
daxFileName = 'apiRequests/dax.csv'
daxTickerList = []
daxNameList = []

ukxFileName = 'apiRequests/ukx.csv'
ukxTickerList = []
ukxNameList = []

spx500FileName = 'apiRequests/spx500.csv'
spx500TickerList = []
spx500NameList = []

stockFieldList = ["PX_MID","PX_LAST","PX_OPEN","PX_LOW","PX_HIGH","PX_VOLUME"]

dataCapPerRequest = 10000
serverIP = '10.8.8.1'
port = 8194

#MUST BE CALLED BEFORE REQUESTING
def initData():
    readInStocks(ukxFileName,ukxTickerList,ukxNameList)
    readInStocks(spx500FileName,spx500TickerList,spx500NameList)
    readInStocks(daxFileName,daxTickerList,daxNameList)

#Individual reader for a stock
def readInStocks(fileName, tickerList, nameList):
    
    fileReader = open(fileName,'r')
    for row in fileReader:
        entry = ((str(row)).rstrip('\n').split(";"))
        tickerList.append(entry[0])
        nameList.append(entry[1])
    #print tickerList
    #print nameList

#Builds a request for a HistoricalDataRequest
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
    initData()
    #makeHistoricalRequest("GKN LN Equity",daxFileName,"PX_MID","20120101", "20121231", "MONTHLY")
    #readInStocks('dax.csv', daxTickerList, daxNameList)
    #makeRandomHistoricalRequest(daxFileName,"20120101", "20121231", "MONTHLY")

#Getters
def getStockNameList(name):
    if(name == daxFileName):
        return daxNameList
    elif(name == ukxFileName):
        return ukxNameList
    elif(name == spx500FileName):
        return spx500NameList

def getStockTickerList(name):
    if(name == daxFileName):
        return daxTickerList
    elif(name == ukxFileName):
        return ukxTickerList
    elif(name == spx500FileName):
        return spx500TickerList

def getMatchingTicker(stock, index):
    tickerList = getStockTickerList(index)
    stockNameList = getStockNameList(index)
    return tickerList[stockNameList.index(stock)]

def getMatchingStock(ticker, index):
    tickerList = getStockTickerList(index)
    stockNameList = getStockNameList(index)
    return stockNameList[tickerListList.index(ticker)]

def getStockFieldList(name):
    return stockFieldList

#Makes a data request of a tick-by-tick history (goes 140 days back)
def makeIntraDayBarRequest():
    # Fill SessionOptions
    sessionOptions = blpapi.SessionOptions()
    sessionOptions.setServerHost(serverIP)
    sessionOptions.setServerPort(port)

    # Create a Session
    session = blpapi.Session(sessionOptions)

    # Start a Session
    if not session.start():
        print "Failed to start session."
        return
    #test

    try:
        # Open service to get historical data from
        if not session.openService("//blp/refdata"):
            print "Failed to open //blp/refdata"
            return

        # Obtain previously opened service
        request = requestBuilder(name, priceField, startDate, finishDate, frequency, session)

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
                        data = fieldData.getElement(priceField)
                        splitElement = data.toString().split()
                        valueList.append(float(splitElement.pop()))

            if ev.eventType() == blpapi.Event.RESPONSE:
                # Response completly received, so we could exit
                break

            counter = counter + 1
    finally:
        # Stop the session
        session.stop()
        #print valueList
    return valueList

#Random historical Data Request
def makeRandomHistoricalRequest(index, startDate, finishDate, frequency):
    stock = getStockTickerList(index)[random.randrange(0,len(getStockTickerList(index)))]
    field = stockFieldList[random.randrange(0,len(stockFieldList))]
    #print stock
    return makeHistoricalRequest(stock, index, field, startDate, finishDate, frequency)

#Use to make request, Note "name" refers to the actual stock's name not its ticker.
def makeHistoricalRequest(name, index, priceField, startDate, finishDate, frequency):

    # Fill SessionOptions
    sessionOptions = blpapi.SessionOptions()
    sessionOptions.setServerHost(serverIP)
    sessionOptions.setServerPort(port)

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
        request = requestBuilder(name, priceField, startDate, finishDate, frequency, session)

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
                        data = fieldData.getElement(priceField)
                        splitElement = data.toString().split()
                        valueList.append(float(splitElement.pop()))

            if ev.eventType() == blpapi.Event.RESPONSE:
                # Response completly received, so we could exit
                break

            counter = counter + 1
    finally:
        # Stop the session
        session.stop()
        #print valueList
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
#print "Connecting to %s:%s" % (serverIP, port)
#print "Sending Request:", request

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