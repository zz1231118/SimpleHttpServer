(function(window) {
	var DateTime = function(date) {
		return new DateTime.fn(date);
	}

	DateTime.fn = function(param) {
		this.time = param instanceof Date ? param : new Date(param);

        this.year = this.time.getFullYear();
        //js 中，月是从0开始的
        this.month = this.time.getMonth() + 1;
        this.day = this.time.getDate();
        this.hour = this.time.getHours();
        this.minute = this.time.getMinutes();
        this.second = this.time.getSeconds();
        this.ticks = DateTime.dateToTicks(this.year, this.month, this.day) + 
            DateTime.timeToTicks(this.hour, this.minute, this.second);
    }
	DateTime.fn.extend = function() {
		var arg = arguments[0];
		for (var key in arg) {
			this.prototype[key] = arg[key];
		}
	}
	DateTime.extend = function() {
		var arg = arguments[0];
		for (var key in arg) {
			this[key] = arg[key];
		}
	}
	DateTime.extend({
		now: function() {
			return new DateTime.fn(new Date());
		}
	});
    DateTime.fn.extend({
        toString: function() {
            function padLeft(number) {
                return number <= 9 ? "0" + number.toString() : number.toString();
            }
            return this.year.toString() + "-" + padLeft(this.month) + "-" + padLeft(this.day) + " " +
                padLeft(this.hour) + ":" + padLeft(this.minute) + ":" + padLeft(this.second);
        }
    });
    
    DateTime.ticksPerMillisecond = 10000;
    DateTime.ticksPerSecond = DateTime.ticksPerMillisecond * 1000;
    DateTime.ticksPerMinute = DateTime.ticksPerSecond * 60;
    DateTime.ticksPerHour = DateTime.ticksPerMinute * 60;
    DateTime.ticksPerDay = DateTime.ticksPerHour * 24;
    DateTime.daysToMonth365 = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334, 365];
    DateTime.daysToMonth366 = [0, 31, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335, 366];
    DateTime.maxSeconds = 9223372036854775807 / DateTime.ticksPerSecond;
    DateTime.minSeconds = -9223372036854775808 / DateTime.ticksPerSecond;

    DateTime.extend({
        isLeapYear(year) {
            if (year < 1 || year > 9999) {
                throw "argument out of range year";
            }
            return year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
        },
        dateToTicks: function(year, month, day) {
            if (year >= 1 && year <= 9999 && month >= 1 && month <= 12) {
                var days = DateTime.isLeapYear(year) ? DateTime.daysToMonth366 : DateTime.daysToMonth365;
                if (day >= 1 && day <= days[month] - days[month - 1]) {
                    var y = year - 1;
                    var n = (y * 365 + y / 4 - y / 100 + y / 400 + days[month - 1] + day - 1).toFixed(0);
                    return n * DateTime.ticksPerDay;
                }
            }
            throw "argument out of range bad year month day";
        },
        timeToTicks: function(hour, minute, second)
        {
            if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60 && second >= 0 && second < 60)
            {
                var totalSeconds = hour * 3600 + minute * 60 + second;
                if (totalSeconds > DateTime.maxSeconds || totalSeconds < DateTime.minSeconds) {
                    throw "overflow time span too long";
                }
                return totalSeconds * DateTime.ticksPerSecond;
            }
            throw "argument out of range bad hour minute second";
        },
        parse: function(format) {
            return new DateTime.fn(format);
        },
    });
	window.DateTime = DateTime;
})(window);