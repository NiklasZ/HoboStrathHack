import blpapi
import random
import csv
from optparse import OptionParser

#Global vars
daxName = 'dax'
daxFileName = 'apiRequests/dax.csv'
daxTickerList = []
daxNameList = []

ukxName = 'ukx'
ukxFileName = 'apiRequests/ukx.csv'
ukxTickerList = []
ukxNameList = []

spx500Name = 'spx500'
spx500FileName = 'apiRequests/spx500.csv'
spx500TickerList = []
spx500NameList = []

stockFieldList = ["PX_MID","PX_LAST","PX_OPEN","PX_LOW","PX_HIGH","PX_VOLUME"]
intraBarRequestFieldList = ["TRADE","BEST","ASK","BEST_BID","BEST_ASK"]

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
def buildHistoryRequest(name, price, startDate, finishDate, frequency, session):

    refDataService = session.getService("//blp/refdata")
    request = refDataService.createRequest("HistoricalDataRequest")
    request.getElement("securities").appendValue(name)
    request.getElement("fields").appendValue(price)

    #request.set("security", name)
    request.set("periodicitySelection",frequency)
    request.set("startDate", startDate)
    request.set("endDate", finishDate)
    request.set("maxDataPoints", dataCapPerRequest)

    return request

#Builds a request for a ReferenceDataRequest
def buildReferenceRequest():
    
    refDataService = session.getService("//blp/refdata")
    request = refDataService.createRequest("ReferenceDataRequest")
    request.append("securities","IBM US Equity")
    request.getElement("fields").appendValue(price)

    #request.set("security", name)
    request.set("periodicitySelection",frequency)
    request.set("startDate", startDate)
    request.set("endDate", finishDate)
    request.set("maxDataPoints", dataCapPerRequest)

    return request

#Default method
def main():
    initData()
    specialAndyRequestRequest("20140101", "20140801", "DAILY")
    #makeHistoricalRequest("Allianz SE",'apiRequests/dax.csv',"PX_MID","20140101", "20140801", "DAILY")
    #readInStocks('dax.csv', daxTickerList, daxNameList)
    #makeRandomHistoricalRequest(daxFileName,"20120101", "20121231", "MONTHLY")

#Getters
def getStockNameList(name):
    if(name == daxName):
        return daxNameList
    elif(name == ukxName):
        return ukxNameList
    elif(name == spx500Name):
        return spx500NameList

def getStockTickerList(name):
    if(name == daxName):
        return daxTickerList
    elif(name == ukxName):
        return ukxTickerList
    elif(name == spx500Name):
        return spx500TickerList

def getMatchingTicker(stock, index):
    tickerList = getStockTickerList(index)
    stockNameList = getStockNameList(index)
    return tickerList[stockNameList.index(stock)]

def getMatchingStock(ticker, index):
    tickerList = getStockTickerList(index)
    stockNameList = getStockNameList(index)
    return stockNameList[tickerList.index(ticker)]

def getStockFieldList(name):
    return stockFieldList

def specialAndyRequestRequest(startDate, finishDate, frequency):
    number = random.randrange(0,3)
    if(number == 0):
        index = daxName
        tickerList = daxTickerList
        nameList = daxNameList
    elif(number == 1):
        index = ukxName
        tickerList = ukxTickerList
        nameList = ukxNameList 
    elif(number == 2):
        index = spx500Name
        tickerList = spx500TickerList
        nameList = spx500NameList
    
    priceField = "PX_MID"
    stock = tickerList[random.randrange(0,len(tickerList))]
    stockName = nameList[tickerList.index(stock)]
    data = makeHistoricalRequest(stockName, index, priceField, startDate, finishDate, frequency)
    #print data
    dictionary = {"Stock Name": stockName, "Index": index, "Data": data}
    #print dictionary
    return dictionary

#Random historical Data Request
def makeRandomHistoricalRequest(index, startDate, finishDate, frequency):
    stock = getStockTickerList(index)[random.randrange(0,len(getStockTickerList(index)))]
    field = stockFieldList[random.randrange(0,len(stockFieldList))]
    #print stock
    return makeHistoricalRequest(stock, field, startDate, finishDate, frequency)

#Use to make request, Note "name" refers to the actual stock's name not its ticker.
def makeHistoricalRequest(name, index, priceField, startDate, finishDate, frequency):

    tickerName = getMatchingTicker(name, index);
    # Fill SessionOptions
    sessionOptions = blpapi.SessionOptions()
    sessionOptions.setServerHost(serverIP)
    sessionOptions.setServerPort(port)

    # Create a Session
    session = blpapi.Session(sessionOptions)
    valueList = []
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
        request = buildHistoryRequest(tickerName, priceField, startDate, finishDate, frequency, session)

        #print "Sending Request:", request
        # Send the request
        session.sendRequest(request)
        # Process received events
        counter = 0
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
        print valueList
        session.stop()
    return valueList

if __name__ == "__main__":
    #print "SimpleHistoryExample"
    try:
        main()
    except KeyboardInterrupt:
        print "Ctrl+C pressed. Stopping..."


    #Can be used to obtain live ticks.
    def makeReferenceDataRequest(name, index, priceField, interval):
        tickerName = getMatchingTicker(name, index);
        # Fill SessionOptions
        sessionOptions = blpapi.SessionOptions()
        sessionOptions.setServerHost(serverIP)
        sessionOptions.setServerPort(port)

        # Create a Session
        session = blpapi.Session(sessionOptions)
        valueList = []
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
            request = buildHistoryRequest(tickerName, priceField, startDate, finishDate, frequency, session)

            #print "Sending Request:", request
            # Send the request
            session.sendRequest(request)
            # Process received events
            counter = 0
            while(True):
                # We provide timeout to give the chance for Ctrl+C handling:
                event = session.nextEvent(500)
                for msg in event:
                    print msg
                        # securityData = msg.getElement("securityData")
                        # for field in securityData.values():
                        #     fieldData = field.getElement("fieldData")
                        #     if fieldData.hasElement("INDX_MEMBERS"):
                        #         indxMembers = fieldData.getElement("INDX_MEMBERS")
                        #         names = []
                        #         for member in indxMembers.values():
                        #             name = member.getElement("Member Ticker and Exchange Code").getValue()
                        #             names += [name + " Index"]
                        #         results = _getData(session, requestName, names, [GICS_SECTOR_NAME, TITLE])

                    if ev.eventType() == blpapi.Event.RESPONSE:
                    # Response completly received, so we could exit
                        break

                counter = counter + 1
        finally:
            # Stop the session
            print valueList
            session.stop()
        return valueList


#---UNUSED CODE---

#Builds a request for an IntraBarRequest
# def makeIntraRequest(name, price, startDate, finishDate, frequency, session):

#     refDataService = session.getService("//blp/refdata")
#     request = refDataService.createRequest("IntradayBarRequest")

#     request.set("periodicityAdjustment", "ACTUAL")
#     request.set("periodicitySelection",frequency)
#     request.set("startDate", startDate)
#     request.set("endDate", finishDate)
#     request.set("maxDataPoints", dataCapPerRequest)

#     return request

#Makes a data request of a tick-by-tick history (goes 140 days back)
# def makeIntraDayBarRequest():
#     # Fill SessionOptions
#     sessionOptions = blpapi.SessionOptions()
#     sessionOptions.setServerHost(serverIP)
#     sessionOptions.setServerPort(port)

#     # Create a Session
#     session = blpapi.Session(sessionOptions)

#     # Start a Session
#     if not session.start():
#         print "Failed to start session."
#         return
#     #test
#     valueList = []
#     try:
#         # Open service to get historical data from
#         if not session.openService("//blp/refdata"):
#             print "Failed to open //blp/refdata"
#             return

#         # Obtain previously opened service
#         request = makeIntraRequest(name, priceField, startDate, finishDate, frequency, session)

#         # Send the request
#         session.sendRequest(request)
#         # Process received events
#         counter = 0
#         while(True):
#             # We provide timeout to give the chance for Ctrl+C handling:
#             ev = session.nextEvent(500)
#             if counter > 2:
#                 for msg in ev:
#                     #print msg
#                     fieldDataArr = msg.getElement("securityData").getElement("fieldData")
#                     for fieldData in fieldDataArr.values():
#                         data = fieldData.getElement(priceField)
#                         splitElement = data.toString().split()
#                         valueList.append(float(splitElement.pop()))

#             if ev.eventType() == blpapi.Event.RESPONSE:
#                 # Response completly received, so we could exit
#                 break

#             counter = counter + 1
#     finally:
#         # Stop the session
#         session.stop()
#         #print valueList
#     return valueList
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